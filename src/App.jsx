import { useState } from "react";

// Modern MindMap Component with curved connections
function MindMap({ nodes = [] }) {
  const containerStyle = {
    position: "relative",
    width: "100%",
    minHeight: 1000,
    border: "none",
    overflow: "auto",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    borderRadius: 16,
    padding: 40,
  };

  const nodeBox = (n) => ({
    position: "absolute",
    left: n.x,
    top: n.y,
    width: n.level === 0 ? 240 : n.level === 1 ? 220 : 200,
    padding: 0,
    boxSizing: "border-box",
    background: "white",
    borderRadius: 16,
    boxShadow: n.level === 0 
      ? "0 20px 60px rgba(0,0,0,0.3)" 
      : "0 10px 40px rgba(0,0,0,0.2)",
    overflow: "hidden",
    zIndex: 100,
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    cursor: "pointer",
  });

  const imgContainerStyle = {
    width: "100%",
    height: 140,
    overflow: "hidden",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    position: "relative",
  };

  const imgStyle = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  };

  const labelContainerStyle = (n) => ({
    padding: 16,
    textAlign: "center",
    background: n.level === 0 ? "#f8f9fa" : "white",
    borderTop: `3px solid ${n.level === 0 ? "#667eea" : n.level === 1 ? "#764ba2" : "#f093fb"}`,
  });

  if (!nodes || nodes.length === 0) {
    return (
      <div style={{ 
        padding: 60, 
        color: "white", 
        textAlign: "center", 
        fontSize: 18,
        fontWeight: 500,
      }}>
        No mind map yet — paste your notes and click generate! ✨
      </div>
    );
  }

  // Calculate connection points
  const getConnectionPoints = (parent, child) => {
    const parentRight = parent.x + (parent.level === 0 ? 240 : parent.level === 1 ? 220 : 200);
    const parentCenterY = parent.y + 70;
    const childLeft = child.x;
    const childCenterY = child.y + 70;
    
    return {
      x1: parentRight,
      y1: parentCenterY,
      x2: childLeft,
      y2: childCenterY,
    };
  };

  // Draw curved SVG connections
  const renderConnections = () => {
    const paths = [];
    nodes.forEach((node) => {
      if (node.parentId) {
        const parent = nodes.find((n) => n.id === node.parentId);
        if (parent) {
          const { x1, y1, x2, y2 } = getConnectionPoints(parent, node);
          
          // Create smooth curved path
          const midX = (x1 + x2) / 2;
          const path = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
          
          const strokeColor = node.level === 1 
            ? "rgba(102, 126, 234, 0.6)" 
            : node.level === 2 
            ? "rgba(118, 75, 162, 0.5)" 
            : "rgba(240, 147, 251, 0.4)";
          
          paths.push(
            <path
              key={`path-${node.id}`}
              d={path}
              stroke={strokeColor}
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
            />
          );
          
          // Add decorative dot at connection start
          paths.push(
            <circle
              key={`dot-${node.id}`}
              cx={x1}
              cy={y1}
              r="6"
              fill={strokeColor}
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
        {paths}
      </svg>
    );
  };

  return (
    <div style={containerStyle}>
      {renderConnections()}
      {nodes.map((n) => (
        <div 
          key={n.id} 
          style={nodeBox(n)}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-8px) scale(1.02)";
            e.currentTarget.style.boxShadow = "0 25px 70px rgba(0,0,0,0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0) scale(1)";
            e.currentTarget.style.boxShadow = n.level === 0 
              ? "0 20px 60px rgba(0,0,0,0.3)" 
              : "0 10px 40px rgba(0,0,0,0.2)";
          }}
        >
          <div style={imgContainerStyle}>
            {n.image ? (
              <img src={n.image} alt={n.label} style={imgStyle} />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                ⏳ Loading...
              </div>
            )}
          </div>
          <div style={labelContainerStyle(n)}>
            <div
              style={{
                fontSize: n.level === 0 ? 16 : n.level === 1 ? 15 : 14,
                fontWeight: n.level === 0 ? 700 : 600,
                lineHeight: 1.4,
                color: "#1a1a1a",
              }}
            >
              {n.label}
            </div>
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
    if (!UNSPLASH_KEY) {
      console.warn("Unsplash API key not found");
      return null;
    }

    try {
      // Add more specific search terms for better image results
      const enhancedQuery = `${query} concept illustration`;
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
          enhancedQuery
        )}&client_id=${UNSPLASH_KEY}&per_page=1&orientation=landscape`
      );
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      if (data.results?.length > 0) {
        return data.results[0].urls.regular || data.results[0].urls.small;
      }
      
      // Fallback: try simpler query
      const fallbackRes = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
          query
        )}&client_id=${UNSPLASH_KEY}&per_page=1`
      );
      const fallbackData = await fallbackRes.json();
      if (fallbackData.results?.length > 0) {
        return fallbackData.results[0].urls.small;
      }
      
      return null;
    } catch (err) {
      console.error("Image fetch error:", err);
      return null;
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

  // Optimized horizontal layout
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
        const grandX = 700;
        const maxGrandchildren = 6;

        child.children.slice(0, maxGrandchildren).forEach((grand) => {
          const grandNode = {
            id: `node-${nodeId++}`,
            label: grand.label.length > 38 ? grand.label.substring(0, 38) + "..." : grand.label,
            level: 2,
            x: grandX,
            y: grandY,
            parentId: childNode.id,
            searchQuery: grand.label,
          };
          nodes.push(grandNode);
          grandY += 180;
        });

        const childHeight = Math.max(220, Math.min(child.children.length, maxGrandchildren) * 180);
        childY += childHeight;
      });

      globalY = Math.max(globalY + 280, childY + 120);
    });

    return nodes;
  }

  async function generateMindMapFromText() {
    if (!textInput.trim()) {
      alert("⚠️ Please enter some text to generate a mind map!");
      return;
    }
    
    setLoading(true);
    const structure = parseNotes(textInput);
    
    if (structure.length === 0) {
      alert("⚠️ Could not parse the text. Please check the format.");
      setLoading(false);
      return;
    }
    
    const layoutedNodes = layoutNodes(structure);
    setNodes(layoutedNodes);

    // Fetch images with retry logic
    const nodesWithImages = await Promise.all(
      layoutedNodes.map(async (node) => {
        const image = await fetchImage(node.searchQuery);
        return { ...node, image };
      })
    );

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
      background: "linear-gradient(to bottom, #f8f9fa, #e9ecef)",
      padding: "40px 20px",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
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
          <p style={{ 
            fontSize: 20, 
            color: "#6c757d", 
            fontWeight: 500,
            marginTop: 0,
          }}>
            Transform your notes into stunning visual mind maps
          </p>
        </div>

        <div style={{ 
          background: "white", 
          borderRadius: 20, 
          padding: 32,
          boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
          marginBottom: 40,
        }}>
          <div style={{ marginBottom: 20 }}>
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
                boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 15px rgba(102, 126, 234, 0.4)";
              }}
            >
              ✨ Load Example
            </button>
          </div>

          <textarea
            placeholder={`Paste your structured notes here...

Example format:
Chapter: Your Topic
Introduction: concept1, concept2, concept3
Main Area: subtopic1, subtopic2
1. Section One: detail1, detail2
2. Section Two: detail1, detail2`}
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            style={{
              width: "100%",
              height: 200,
              padding: 16,
              fontSize: 15,
              border: "2px solid #e9ecef",
              borderRadius: 12,
              fontFamily: "'Monaco', 'Menlo', monospace",
              resize: "vertical",
              outline: "none",
              transition: "border-color 0.3s ease",
            }}
            onFocus={(e) => e.target.style.borderColor = "#667eea"}
            onBlur={(e) => e.target.style.borderColor = "#e9ecef"}
          />

          <button
            onClick={generateMindMapFromText}
            disabled={loading}
            style={{
              marginTop: 20,
              padding: "16px 40px",
              fontSize: 18,
              background: loading 
                ? "#adb5bd" 
                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              borderRadius: 12,
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 700,
              width: "100%",
              boxShadow: loading ? "none" : "0 8px 25px rgba(102, 126, 234, 0.4)",
              transition: "transform 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (!loading) e.target.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
            }}
          >
            {loading ? "🔄 Generating..." : "🚀 Generate Mind Map"}
          </button>
        </div>

        {nodes.length > 0 && (
          <div>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "space-between",
              marginBottom: 20,
              flexWrap: "wrap",
              gap: 15,
            }}>
              <h2 style={{ 
                fontSize: 28, 
                fontWeight: 700,
                color: "#212529",
                margin: 0,
              }}>
                Your Visual Mind Map ✨
              </h2>
              <div style={{ display: "flex", gap: 20, fontSize: 14, flexWrap: "wrap" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
                  <div style={{ width: 20, height: 20, background: "linear-gradient(135deg, #667eea, #764ba2)", borderRadius: 6 }}></div>
                  Main Topics
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
                  <div style={{ width: 20, height: 20, background: "linear-gradient(135deg, #764ba2, #f093fb)", borderRadius: 6 }}></div>
                  Subtopics
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
                  <div style={{ width: 20, height: 20, background: "linear-gradient(135deg, #f093fb, #f5576c)", borderRadius: 6 }}></div>
                  Details
                </span>
              </div>
            </div>
            <MindMap nodes={nodes} />
          </div>
        )}
      </div>
    </div>
  );
}
