import { useState } from "react";
import MindMap from "./MindMap.jsx";
import PdfViewer from "./PdfViewer.jsx";

export default function App() {
  const [nodes, setNodes] = useState([]);
  const [textInput, setTextInput] = useState("");
  const [loading, setLoading] = useState(false);

  const UNSPLASH_KEY = import.meta.env.VITE_REACT_APP_UNSPLASH_KEY;

  async function fetchImage(query) {
    try {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
          query
        )}&client_id=${UNSPLASH_KEY}&per_page=1`
      );
      const data = await res.json();
      if (data.results?.length > 0) {
        return data.results[0].urls.small;
      }
      return null;
    } catch (err) {
      console.error("Image fetch error:", err);
      return null;
    }
  }

  // Enhanced parsing function
  function parseNotes(text) {
    const lines = text.split("\n").filter((l) => l.trim() !== "");
    const structure = [];
    let currentParent = null;
    let currentChild = null;

    for (let line of lines) {
      const trimmed = line.trim();
      
      // Main chapter/section (contains ":")
      if (trimmed.includes(":") && !trimmed.startsWith("-") && !trimmed.match(/^\d+\./)) {
        const [title] = trimmed.split(":").map(s => s.trim());
        currentParent = { label: title, children: [], level: 0 };
        structure.push(currentParent);
        currentChild = null;
      }
      // Numbered items (1., 2., 3.)
      else if (trimmed.match(/^\d+\./)) {
        const label = trimmed.replace(/^\d+\.\s*/, "");
        currentChild = { label, children: [], level: 1, parent: currentParent };
        if (currentParent) currentParent.children.push(currentChild);
      }
      // Sub-items (contain commas or semicolons) - extract key terms
      else if (trimmed.includes(",") || trimmed.includes(";")) {
        const terms = trimmed.split(/[,;]/).map(t => t.trim()).filter(t => t.length > 3);
        terms.forEach(term => {
          const cleanTerm = term.replace(/^(and|or)\s+/i, "");
          if (cleanTerm.length > 3) {
            const item = { label: cleanTerm, children: [], level: 2, parent: currentChild || currentParent };
            if (currentChild) {
              currentChild.children.push(item);
            } else if (currentParent) {
              currentParent.children.push(item);
            }
          }
        });
      }
      // Simple items
      else if (trimmed.length > 3) {
        const item = { label: trimmed, children: [], level: currentChild ? 2 : 1, parent: currentChild || currentParent };
        if (currentChild) {
          currentChild.children.push(item);
        } else if (currentParent) {
          currentParent.children.push(item);
        }
      }
    }

    return structure;
  }

  // Layout nodes hierarchically
  function layoutNodes(structure) {
    const nodes = [];
    let nodeId = 0;
    let yOffset = 50;

    structure.forEach((parent) => {
      const parentNode = {
        id: `node-${nodeId++}`,
        label: parent.label,
        level: 0,
        x: 50,
        y: yOffset,
        searchQuery: parent.label,
      };
      nodes.push(parentNode);
      yOffset += 180;

      let childX = 300;
      let childY = parentNode.y;

      parent.children.forEach((child, idx) => {
        const childNode = {
          id: `node-${nodeId++}`,
          label: child.label,
          level: 1,
          x: childX,
          y: childY,
          parentId: parentNode.id,
          searchQuery: child.label,
        };
        nodes.push(childNode);

        // Position grandchildren
        let grandX = childX + 250;
        let grandY = childY;

        child.children.slice(0, 4).forEach((grand) => {
          const grandNode = {
            id: `node-${nodeId++}`,
            label: grand.label.length > 40 ? grand.label.substring(0, 40) + "..." : grand.label,
            level: 2,
            x: grandX,
            y: grandY,
            parentId: childNode.id,
            searchQuery: grand.label,
          };
          nodes.push(grandNode);
          grandY += 140;
        });

        childY += Math.max(180, child.children.length * 140);
      });

      yOffset = Math.max(yOffset, childY + 50);
    });

    return nodes;
  }

  async function generateMindMapFromText() {
    if (!textInput.trim()) return;
    
    setLoading(true);
    const structure = parseNotes(textInput);
    const layoutedNodes = layoutNodes(structure);

    // Set nodes first without images
    setNodes(layoutedNodes);

    // Fetch images asynchronously
    const nodesWithImages = await Promise.all(
      layoutedNodes.map(async (node) => {
        const image = await fetchImage(node.searchQuery);
        return { ...node, image };
      })
    );

    setNodes(nodesWithImages);
    setLoading(false);
  }

  return (
    <div style={{ padding: 20, fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <h1 style={{ color: "#1976d2", marginBottom: 10 }}>VisualNotes – Image Mind Map Generator</h1>
      <p style={{ color: "#666", marginBottom: 20 }}>
        Paste structured notes below and generate an interactive visual mind map with images
      </p>

      <textarea
        placeholder="Paste your notes here (supports hierarchical text with colons, numbers, and commas)..."
        value={textInput}
        onChange={(e) => setTextInput(e.target.value)}
        style={{
          width: "100%",
          height: 200,
          padding: 12,
          fontSize: 14,
          border: "2px solid #ddd",
          borderRadius: 8,
          fontFamily: "monospace",
        }}
      />

      <button
        onClick={generateMindMapFromText}
        disabled={loading}
        style={{
          marginTop: 15,
          padding: "12px 24px",
          fontSize: 16,
          background: loading ? "#ccc" : "#1976d2",
          color: "white",
          border: "none",
          borderRadius: 6,
          cursor: loading ? "not-allowed" : "pointer",
          fontWeight: 500,
        }}
      >
        {loading ? "Generating..." : "Generate Mind Map"}
      </button>

      {nodes.length > 0 && (
        <div style={{ marginTop: 30 }}>
          <h2 style={{ color: "#333", fontSize: 18 }}>Your Visual Mind Map</h2>
          <MindMap nodes={nodes} />
        </div>
      )}
    </div>
  );
}
