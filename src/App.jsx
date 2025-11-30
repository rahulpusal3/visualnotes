import { useState } from "react";
import MindMap from "./MindMap";
import PdfViewer from "./PdfViewer";

export default function App() {
  const [mode, setMode] = useState("notes");
  const [nodes, setNodes] = useState([]);
  const [textInput, setTextInput] = useState("");

  const UNSPLASH_KEY = import.meta.env.VITE_REACT_APP_UNSPLASH_KEY;

  async function fetchImage(query) {
    try {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
          query
        )}&client_id=${UNSPLASH_KEY}`
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

  async function generateMindMapFromText() {
    const lines = textInput.split("\n").filter((l) => l.trim() !== "");
    const newNodes = [];
    let yOffset = 0;

    for (let line of lines) {
      const image = await fetchImage(line);
      newNodes.push({
        id: line,
        label: line,
        image,
        x: 200,
        y: yOffset,
      });
      yOffset += 150;
    }

    setNodes(newNodes);
  }

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>VisualNotes – Convert Notes into Image Mind Maps</h1>

      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setMode("notes")}>Notes → Mindmap</button>
        <button onClick={() => setMode("pdf")}>PDF Upload</button>
      </div>

      {mode === "notes" && (
        <>
          <textarea
            placeholder="Paste your notes here..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            style={{ width: "100%", height: 150 }}
          />

          <button
            onClick={generateMindMapFromText}
            style={{ marginTop: 10, padding: "10px 20px" }}
          >
            Generate Mind Map
          </button>

          <MindMap nodes={nodes} />
        </>
      )}

      {mode === "pdf" && <PdfViewer />}
    </div>
  );
}
