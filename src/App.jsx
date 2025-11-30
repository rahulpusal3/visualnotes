import { useState } from "react";

// Flipable Card Component
function FlipCard({ node, onFlip }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [aiInfo, setAiInfo] = useState("");
  const [loadingInfo, setLoadingInfo] = useState(false);

  const handleFlip = async () => {
    if (!isFlipped && !aiInfo) {
      setLoadingInfo(true);
      // Generate AI facts
      try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 200,
            messages: [
              {
                role: "user",
                content: `Give me 3 brief, interesting facts about "${node.label}" in 2-3 sentences. Be concise and educational.`
              }
            ],
          })
        });
        const data = await response.json();
        if (data.content?.[0]?.text) {
          setAiInfo(data.content[0].text);
        } else {
          setAiInfo(`${node.label}: Key concept in understanding this topic. Click to explore more connections in the mind map.`);
        }
      } catch (err) {
        setAiInfo(`${node.label}: An important concept worth exploring further. Connect with related ideas to deepen understanding.`);
      }
      setLoadingInfo(false);
    }
    setIsFlipped(!isFlipped);
  };

  const cardStyle = {
    position: "absolute",
    left: node.x,
    top: node.y,
    width: node.level === 0 ? 240 : node.level === 1 ? 220 : 200,
    height: 220,
    perspective: "1000px",
    zIndex: 100,
    cursor: "pointer",
  };

  const cardInnerStyle = {
    position: "relative",
    width: "100%",
    height: "100%",
    transition: "transform 0.6s",
    transformStyle: "preserve-3d",
    transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
  };

  const cardFaceStyle = {
    position: "absolute",
    width: "100%",
    height: "100%",
    backfaceVisibility: "hidden",
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
  };

  const frontStyle = {
    ...cardFaceStyle,
    background: "white",
  };

  const backStyle = {
    ...cardFaceStyle,
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    transform: "rotateY(180deg)",
    padding: 20,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    color: "white",
  };

  return (
    <div style={cardStyle} onClick={handleFlip}>
      <div style={cardInnerStyle}>
        {/* Front */}
        <div style={frontStyle}>
          <div style={{
            width: "100%",
            height: 140,
            background: node.image 
              ? `url(${node.image}) center/cover` 
              : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 14,
            fontWeight: 600,
          }}>
            {!node.image && "⏳"}
          </div>
          <div style={{
            padding: 16,
            textAlign: "center",
            borderTop: `3px solid ${node.level === 0 ? "#667eea" : node.level === 1 ? "#764ba2" : "#f093fb"}`,
          }}>
            <div style={{
              fontSize: node.level === 0 ? 16 : node.level === 1 ? 15 : 14,
              fontWeight: node.level === 0 ? 700 : 600,
              lineHeight: 1.4,
              color: "#1a1a1a",
            }}>
              {node.label}
            </div>
            <div style={{
              marginTop: 8,
              fontSize: 11,
              color: "#999",
              fontWeight: 500,
            }}>
              Click to flip 🔄
            </div>
          </div>
        </div>

        {/* Back */}
        <div style={backStyle}>
          {loadingInfo ? (
            <div>⏳ Loading facts...</div>
          ) : (
            <>
              <div style={{
                fontSize: 15,
                fontWeight: 700,
                marginBottom: 12,
                textAlign: "center",
              }}>
                {node.label}
              </div>
              <div style={{
                fontSize: 13,
                lineHeight: 1.5,
                textAlign: "center",
                opacity: 0.95,
              }}>
                {aiInfo || "Click to see details..."}
              </div>
              <div style={{
                marginTop: 12,
                fontSize: 11,
                opacity: 0.8,
              }}>
                Click to flip back 🔄
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Modern MindMap Component
function MindMap({ nodes = [] }) {
  const containerStyle = {
    position: "relative",
    width: "100%",
    minHeight: 1000,
    border: "none",
    overflow: "auto",
    background: "#ffffff",
    borderRadius: 16,
    padding: 40,
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  };

  if (!nodes || nodes.length === 0) {
    return (
      <div style={{ 
        padding: 60, 
        color: "#999", 
        textAlign: "center", 
        fontSize: 18,
        fontWeight: 500,
      }}>
        No mind map yet — paste your notes and click generate! ✨
      </div>
    );
  }

  const getConnectionPoints = (parent, child) => {
    const parentRight = parent.x + (parent.level === 0 ? 240 : parent.level === 1 ? 220 : 200);
    const parentCenterY = parent.y + 110;
    const childLeft = child.x;
    const childCenterY = child.y + 110;
    
    return { x1: parentRight, y1: parentCenterY, x2: childLeft, y2: childCenterY };
  };

  const renderConnections = () => {
    const paths = [];
    nodes.forEach((node) => {
      if (node.parentId) {
        const parent = nodes.find((n) => n.id === node.parentId);
        if (parent) {
          const { x1, y1, x2, y2 } = getConnectionPoints(parent, node);
          const midX = (x1 + x2) / 2;
          const path = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
          
          const strokeColor = node.level === 1 
            ? "#667eea" 
            : node.level === 2 
            ? "#764ba2" 
            : "#f093fb";
          
          paths.push(
            <g key={`conn-${node.id}`}>
              <path
                d={path}
                stroke={strokeColor}
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                opacity="0.7"
              />
              <circle cx={x1} cy={y1} r="7" fill={strokeColor} opacity="0.8" />
              <circle cx={x2} cy={y2} r="7" fill={strokeColor} opacity="0.8" />
            </g>
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
        {paths}
      </svg>
    );
  };

  return (
    <div style={containerStyle}>
      {renderConnections()}
      {nodes.map((n) => (
        <FlipCard key={n.id} node={n} />
      ))}
    </div>
  );
}

// Main App
export default function App() {
  const [nodes, setNodes] = useState([]);
  const [textInput, setTextInput] = useState("");
  const [loading, setLoading] = useState(false);

  const UNSPLASH_KEY = import.meta.env.VITE_REACT_APP_UNSPLASH_KEY;

  async function fetchImage(query) {
    if (!UNSPLASH_KEY) {
      console.warn("Unsplash API key not found");
      return `https://source.unsplash.com/400x300/?${encodeURIComponent(query)}`;
    }

    try {
      const enhancedQuery = `${query} illustration`;
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(enhancedQuery)}&client_id=${UNSPLASH_KEY}&per_page=1&orientation=landscape`,
        { timeout: 3000 }
      );
      
      if (!res.ok) throw new Error("API error");
      
      const data = await res.json();
      if (data.results?.length > 0) {
        return data.results[0].urls.small;
      }
      
      return `https://source.unsplash.com/400x300/?${encodeURIComponent(query)}`;
    } catch (err) {
      console.error("Image fetch error:", err);
      return `https://source.unsplash.com/400x300/?${encodeURIComponent(query)}`;
    }
  }

  function parseNotes(text) {
    const lines = text.split("\n").filter((l) => l.trim() !== "");
    const structure = [];
    let currentParent = null;
    let currentChild = null;

    if (lines.length === 1 && lines[0].includes(",")) {
      const items = lines[0].split(",").map(s => s.trim()).filter(s => s.length > 0);
      items.forEach(item => {
        structure.push({ label: item, children: [], level: 0 });
      });
      return structure;
    }

    for (let line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.includes(":") && !trimmed.startsWith("-") && !trimmed.match(/^\d+\./)) {
        const parts = trimmed.split(":");
        const title = parts[0].trim();
        currentParent = { label: title, children: [], level: 0 };
        structure.push(currentParent);
        currentChild = null;
        
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
      else if (trimmed.match(/^\d+\./)) {
        const content = trimmed.replace(/^\d+\.\s*/, "");
        const parts = content.split(":");
        const label = parts[0].trim();
        
        currentChild = { label, children: [], level: 1, parent: currentParent };
        if (currentParent) currentParent.children.push(currentChild);
        
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

  function layoutNodes(structure) {
    const nodes = [];
    let nodeId = 0;
    let globalY = 60;

    structure.forEach((parent) => {
      const parentNode = {
        id: `node-${nodeId++}`,
        label: parent.label,
        level: 0,
        x: 60,
        y: globalY,
        searchQuery: parent.label,
      };
      nodes.push(parentNode);

      let childY = globalY;
      const childX = 380;

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

        let grandY = childY;
        const grandX = 680;
        const maxGrandchildren = 6;

        child.children.slice(0, maxGrandchildren).forEach((grand) => {
          const grandNode = {
            id: `node-${nodeId++}`,
            label: grand.label.length > 35 ? grand.label.substring(0, 35) + "..." : grand.label,
            level: 2,
            x: grandX,
            y: grandY,
            parentId: childNode.id,
            searchQuery: grand.label,
          };
          nodes.push(grandNode);
          grandY += 260;
        });

        const childHeight = Math.max(260, Math.min(child.children.length, maxGrandchildren) * 260);
        childY += childHeight;
      });

      globalY = Math.max(globalY + 300, childY + 120);
    });

    return nodes;
  }

  async function generateMindMapFromText() {
    if (!textInput.trim()) {
      alert("⚠️ Please enter text!");
      return;
    }
    
    setLoading(true);
    const structure = parseNotes(textInput);
    
    if (structure.length === 0) {
      alert("⚠️ Could not parse text. Check format.");
      setLoading(false);
      return;
    }
    
    const layoutedNodes = layoutNodes(structure);

    // Load images in parallel with timeout
    const imagePromises = layoutedNodes.map(async (node) => {
      const image = await Promise.race([
        fetchImage(node.searchQuery),
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000))
      ]).catch(() => `https://source.unsplash.com/400x300/?${encodeURIComponent(node.searchQuery)}`);
      
      return { ...node, image };
    });

    const nodesWithImages = await Promise.all(imagePromises);
    setNodes(nodesWithImages);
    setLoading(false);
  }

  const exampleText = `Chapter: Thinking
Introduction to Thinking Concepts: Cognitive Psychologist, Thinking, Symbols, Prototype, Categories
Types of Thinking: Perceptual thinking, conceptual thinking, reflective thinking, creative thinking, critical thinking
Mental structures: Concepts, schemas, mental imagery
1. Reasoning: deductive reasoning, inductive reasoning, analogical reasoning
2. Decision making
3. Problem solving: well defined problems, ill-defined problems
Problem solving strategies: sub goals, working backward, insight, Heuristics, algorithm, trial and error`;

  return (
    <div style={{ 
      minHeight: "100vh",
      background: "linear-gradient(to bottom, #f8f9fa, #ffffff)",
      padding: "40px 20px",
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 style={{ 
            fontSize: 48, 
            fontWeight: 800,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: 12,
          }}>
            🧠 VisualNotes
          </h1>
          <p style={{ fontSize: 20, color: "#6c757d", fontWeight: 500, marginTop: 0 }}>
            Transform notes into interactive visual mind maps • Click cards to flip!
          </p>
        </div>

        <div style={{ 
          background: "white", 
          borderRadius: 20, 
          padding: 32,
          boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
          marginBottom: 40,
        }}>
          <button
            onClick={() => setTextInput(exampleText)}
            style={{
              padding: "12px 24px",
              fontSize: 15,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              borderRadius: 12,
              cursor: "pointer",
              fontWeight: 600,
              marginBottom: 20,
            }}
          >
            ✨ Load Example
          </button>

          <textarea
            placeholder="Paste structured notes..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            style={{
              width: "100%",
              height: 200,
              padding: 16,
              fontSize: 15,
              border: "2px solid #e9ecef",
              borderRadius: 12,
              fontFamily: "monospace",
              resize: "vertical",
            }}
          />

          <button
            onClick={generateMindMapFromText}
            disabled={loading}
            style={{
              marginTop: 20,
              padding: "16px 40px",
              fontSize: 18,
              background: loading ? "#adb5bd" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              borderRadius: 12,
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 700,
              width: "100%",
            }}
          >
            {loading ? "🔄 Generating..." : "🚀 Generate Mind Map"}
          </button>
        </div>

        {nodes.length > 0 && (
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 20 }}>
              Your Interactive Mind Map ✨
            </h2>
            <MindMap nodes={nodes} />
          </div>
        )}
      </div>
    </div>
  );
}
