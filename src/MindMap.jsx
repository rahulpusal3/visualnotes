
// src/MindMap.jsx
import React from "react";

export default function MindMap({ nodes = [] }) {
  // container size can be adjusted
  const containerStyle = {
    position: "relative",
    width: "100%",
    height: 500,
    border: "1px solid #eee",
    overflow: "auto",
    background: "#fff",
  };

  const nodeBox = (n) => ({
    position: "absolute",
    left: n.x ?? 100,
    top: n.y ?? 100,
    width: 160,
    padding: 6,
    boxSizing: "border-box",
    textAlign: "center",
    background: "#fafafa",
    border: "1px solid #ddd",
    borderRadius: 6,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  });

  const imgStyle = {
    width: "100%",
    height: 90,
    objectFit: "cover",
    borderRadius: 4,
    marginBottom: 6,
    background: "#eee",
  };

  if (!nodes || nodes.length === 0) {
    return (
      <div style={{ padding: 12, color: "#333" }}>
        No nodes yet — generate a mind map from notes.
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {nodes.map((n) => (
        <div key={n.id || n.label} style={nodeBox(n)}>
          {n.image ? (
            <img src={n.image} alt={n.label} style={imgStyle} />
          ) : (
            <div style={{ ...imgStyle, display: "flex", alignItems: "center", justifyContent: "center", color: "#888" }}>
              No image
            </div>
          )}
          <div style={{ fontSize: 14, fontWeight: 500 }}>{n.label}</div>
        </div>
      ))}
    </div>
  );
}
