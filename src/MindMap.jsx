import React from "react";

export default function MindMap({ nodes = [] }) {
  const containerStyle = {
    position: "relative",
    width: "100%",
    minHeight: 800,
    border: "1px solid #eee",
    overflow: "auto",
    background: "#f8f9fa",
  };

  const nodeBox = (n) => ({
    position: "absolute",
    left: n.x ?? 100,
    top: n.y ?? 100,
    width: n.level === 0 ? 200 : 180,
    padding: 8,
    boxSizing: "border-box",
    textAlign: "center",
    background: n.level === 0 ? "#e3f2fd" : n.level === 1 ? "#fff3e0" : "#f1f8e9",
    border: `2px solid ${n.level === 0 ? "#1976d2" : n.level === 1 ? "#f57c00" : "#689f38"}`,
    borderRadius: 8,
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    zIndex: 10,
  });

  const imgStyle = {
    width: "100%",
    height: 100,
    objectFit: "cover",
    borderRadius: 6,
    marginBottom: 8,
    background: "#eee",
  };

  if (!nodes || nodes.length === 0) {
    return (
      <div style={{ padding: 20, color: "#666", textAlign: "center" }}>
        No nodes yet — paste your notes and generate a mind map.
      </div>
    );
  }

  // Draw connections between parent and children
  const renderConnections = () => {
    return nodes.map((node) => {
      if (node.parentId) {
        const parent = nodes.find((n) => n.id === node.parentId);
        if (parent) {
          return (
            <svg
              key={`line-${node.id}`}
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
              <line
                x1={parent.x + 100}
                y1={parent.y + 50}
                x2={node.x + 90}
                y2={node.y + 50}
                stroke={node.level === 1 ? "#1976d2" : "#689f38"}
                strokeWidth="2"
                opacity="0.5"
              />
            </svg>
          );
        }
      }
      return null;
    });
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
                fontSize: 12,
              }}
            >
              Loading...
            </div>
          )}
          <div
            style={{
              fontSize: n.level === 0 ? 15 : 13,
              fontWeight: n.level === 0 ? 600 : 500,
              lineHeight: 1.3,
            }}
          >
            {n.label}
          </div>
        </div>
      ))}
    </div>
  );
}
