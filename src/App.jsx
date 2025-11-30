import { useState } from "react";

// MindMap Component with proper connections
function MindMap({ nodes = [] }) {
  const containerStyle = {
    position: "relative",
    width: "100%",
    minHeight: 1200,
    border: "2px solid #ddd",
    overflow: "auto",
    background: "#fafafa",
    borderRadius: 8,
  };

  const nodeBox = (n) => ({
    position: "absolute",
    left: n.x,
    top: n.y,
    width: n.level === 0 ? 220 : n.level === 1 ? 200 : 180,
    padding: 10,
    boxSizing: "border-box",
    textAlign: "center",
    background: n.level === 0 ? "#e3f2fd" : n.level === 1 ? "#fff3e0" : "#f1f8e9",
    border: `3px solid ${n.level === 0 ? "#1976d2" : n.level === 1 ? "#f57c00" : "#689f38"}`,
    borderRadius: 10,
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    zIndex: 10,
  });

  const imgStyle = {
    width: "100%",
    height: 120,
    objectFit: "cover",
    borderRadius: 8,
    marginBottom: 10,
    background: "#e0e0e0",
  };

  if (!nodes || nodes.length === 0) {
    return (
      <div style={{ padding: 40, color: "#666", textAlign: "center", fontSize: 16 }}>
        No nodes yet — paste your notes and generate a mind map.
      </div>
    );
  }

  // Calculate node centers for connection lines
  const getNodeCenter = (node) => ({
    x: node.x + (node.level === 0 ? 110 : node.level === 1 ? 100 : 90),
    y: node.y + 80,
  });

  // Draw SVG connections between parent and children
  const renderConnections = () => {
    const lines = [];
    nodes.forEach((node) => {
      if (node.parentId) {
        const parent = nodes.find((n) => n.id === node.parentId);
        if (parent) {
          const parentCenter = getNodeCenter(parent);
          const childCenter = getNodeCenter(node);
          
          lines.push(
            <line
              key={`line-${node.id}`}
              x1={parentCenter.x}
              y1={parentCenter.y}
              x2={childCenter.x}
              y2={childCenter.y}
              stroke={node.level === 1 ? "#1976d2" : node.level === 2 ? "#f57c00" : "#689f38"}
              strokeWidth="3"
              opacity="0.6"
            />
          );
        }
      }
    });

    return (
      <svg
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 1,
        }}
      >
        {lines}
      </svg>
    );
  };

  return (
    <div style={containerStyle}>
      {renderConnections()}
      {nodes.map((n) => (
        <div key={n.id} style={nodeBox(n)}>
          {n.image ? (
            <img src={n.image} alt={n.label} style={imgStyle} />
          ) : (
            <div
              style={{
                ...imgStyle,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#999",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              Loading image...
            </div>
          )}
          <div
            style={{
              fontSize: n.level === 0 ? 16 : n.level === 1 ? 14 : 13,
              fontWeight: n.level === 0 ? 700 : n.level === 1 ? 600 : 500,
              lineHeight: 1.4,
              color: "#333",
            }}
          >
            {n.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// Main App Component
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

    // Handle single line with commas
    if (lines.length === 1 && lines[0].includes(",")) {
      const items = lines[0].split(",").map(s => s.trim()).filter(s => s.length > 0);
      items.forEach(item => {
        structure.push({ label: item, children: [], level: 0 });
      });
      return structure;
    }

    for (let line of lines) {
      const trimmed = line.trim();
      
      // Main chapter/section (contains ":")
      if (trimmed.includes(":") && !trimmed.startsWith("-") && !trimmed.match(/^\d+\./)) {
        const parts = trimmed.split(":");
        const title = parts[0].trim();
        currentParent = { label: title, children: [], level: 0 };
        structure.push(currentParent);
        currentChild = null;
        
        // Parse items after colon
        if (parts[1] && parts[1].trim()) {
          const items = parts[1].split(/[,;]/).map(s => s.trim()).filter(s => s.length > 2);
          items.forEach(item => {
            const cleanItem = item.replace(/^(and|or)\s+/i, "");
            if (cleanItem.length > 2) {
              currentParent.children.push({ 
                label: cleanItem, 
                children: [], 
                level: 1, 
                parent: currentParent 
              });
            }
          });
        }
      }
      // Numbered items (1., 2., 3.)
      else if (trimmed.match(/^\d+\./)) {
        const content = trimmed.replace(/^\d+\.\s*/, "");
        const parts = content.split(":");
        const label = parts[0].trim();
        
        currentChild = { label, children: [], level: 1, parent: currentParent };
        if (currentParent) currentParent.children.push(currentChild);
        
        // Parse items after colon in numbered item
        if (parts[1] && parts[1].trim()) {
          const items = parts[1].split(/[,;]/).map(s => s.trim()).filter(s => s.length > 2);
          items.forEach(item => {
            const cleanItem = item.replace(/^(and|or)\s+/i, "");
            if (cleanItem.length > 2) {
              currentChild.children.push({ 
                label: cleanItem, 
                children: [], 
                level: 2, 
                parent: currentChild 
              });
            }
          });
        }
      }
      // Sub-items (contain commas or semicolons)
      else if ((trimmed.includes(",") || trimmed.includes(";")) && !trimmed.includes(":")) {
        const terms = trimmed.split(/[,;]/).map(t => t.trim()).filter(t => t.length > 2);
        terms.forEach(term => {
          const cleanTerm = term.replace(/^(and|or)\s+/i, "");
          if (cleanTerm.length > 2) {
            const item = { 
              label: cleanTerm, 
              children: [], 
              level: 2, 
              parent: currentChild || currentParent 
            };
            if (currentChild) {
              currentChild.children.push(item);
            } else if (currentParent) {
              currentParent.children.push(item);
            }
          }
        });
      }
      // Simple items
      else if (trimmed.length > 2) {
        const item = { 
          label: trimmed, 
          children: [], 
          level: currentChild ? 2 : 1, 
          parent: currentChild || currentParent 
        };
        if (currentChild) {
          currentChild.children.push(item);
        } else if (currentParent) {
          currentParent.children.push(item);
        }
      }
    }

    return structure;
  }

  // FIXED: Layout nodes in proper mind map structure
  function layoutNodes(structure) {
    const nodes = [];
    let nodeId = 0;
    let globalY = 50;

    structure.forEach((parent) => {
      const parentNode = {
        id: `node-${nodeId++}`,
        label: parent.label,
        level: 0,
        x: 50,
        y: globalY,
        searchQuery: parent.label,
      };
      nodes.push(parentNode);

      // Calculate total height needed for this parent's children
      let totalChildrenHeight = 0;
      parent.children.forEach(child => {
        const grandchildCount = Math.min(child.children.length, 8);
        totalChildrenHeight += Math.max(200, grandchildCount * 160);
      });

      let childY = globalY;
      const childX = 350; // Position children to the right of parent

      parent.children.forEach((child) => {
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

        // Position grandchildren to the right of children
        let grandY = childY;
        const grandX = childX + 280;
        const maxGrandchildren = 8;

        child.children.slice(0, maxGrandchildren).forEach((grand) => {
          const grandNode = {
            id: `node-${nodeId++}`,
            label: grand.label.length > 45 ? grand.label.substring(0, 45) + "..." : grand.label,
            level: 2,
            x: grandX,
            y: grandY,
            parentId: childNode.id,
            searchQuery: grand.label,
          };
          nodes.push(grandNode);
          grandY += 160;
        });

        // Update childY for next child
        const childHeight = Math.max(200, Math.min(child.children.length, maxGrandchildren) * 160);
        childY += childHeight;
      });

      // Update global Y position for next parent
      globalY = Math.max(globalY + 250, childY + 100);
    });

    return nodes;
  }

  async function generateMindMapFromText() {
    if (!textInput.trim()) {
      alert("Please enter some text to generate a mind map!");
      return;
    }
    
    setLoading(true);
    const structure = parseNotes(textInput);
    
    if (structure.length === 0) {
      alert("Could not parse the text. Please check the format.");
      setLoading(false);
      return;
    }
    
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
    <div style={{ padding: 20, fontFamily: "system-ui, -apple-system, sans-serif", maxWidth: "100%" }}>
      <h1 style={{ color: "#1976d2", marginBottom: 10 }}>VisualNotes – Image Mind Map Generator</h1>
      <p style={{ color: "#666", marginBottom: 20 }}>
        Paste structured notes below and generate an interactive visual mind map with images from Unsplash
      </p>

      <textarea
        placeholder="Example format:
Chapter: Thinking
Introduction to Thinking: Cognitive Psychologist, Symbols, Prototype
Types of Thinking: Perceptual thinking, conceptual thinking, reflective thinking
1. Reasoning: deductive reasoning, inductive reasoning
2. Decision making
3. Problem solving: well defined problems, ill-defined problems"
        value={textInput}
        onChange={(e) => setTextInput(e.target.value)}
        style={{
          width: "100%",
          height: 220,
          padding: 12,
          fontSize: 14,
          border: "2px solid #ddd",
          borderRadius: 8,
          fontFamily: "monospace",
          resize: "vertical",
        }}
      />

      <button
        onClick={generateMindMapFromText}
        disabled={loading}
        style={{
          marginTop: 15,
          padding: "14px 28px",
          fontSize: 16,
          background: loading ? "#ccc" : "#1976d2",
          color: "white",
          border: "none",
          borderRadius: 8,
          cursor: loading ? "not-allowed" : "pointer",
          fontWeight: 600,
          boxShadow: loading ? "none" : "0 2px 8px rgba(25, 118, 210, 0.3)",
        }}
      >
        {loading ? "🔄 Generating Mind Map..." : "🚀 Generate Mind Map"}
      </button>

      {nodes.length > 0 && (
        <div style={{ marginTop: 30 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 15 }}>
            <h2 style={{ color: "#333", fontSize: 20, margin: 0 }}>Your Visual Mind Map</h2>
            <div style={{ display: "flex", gap: 15, fontSize: 13 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 16, height: 16, background: "#e3f2fd", border: "2px solid #1976d2", borderRadius: 3 }}></div>
                Main Topics
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 16, height: 16, background: "#fff3e0", border: "2px solid #f57c00", borderRadius: 3 }}></div>
                Subtopics
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 16, height: 16, background: "#f1f8e9", border: "2px solid #689f38", borderRadius: 3 }}></div>
                Details
              </span>
            </div>
          </div>
          <MindMap nodes={nodes} />
        </div>
      )}
    </div>
  );
}
