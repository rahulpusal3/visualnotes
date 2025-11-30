import { useState } from "react";
import MindMap from "./MindMap.jsx";
import PdfViewer from "./PdfViewer.jsx";

export default function App() {
const [mode, setMode] = useState("notes");
const [nodes, setNodes] = useState([]);
const [textInput, setTextInput] = useState("");
const [loading, setLoading] = useState(false);   // <-- NEW

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
  setLoading(true);
  try {
    const normalized = textInput
      .replace(/\r\n/g, "\n")
      .replace(/\d+\.\s*/g, "\n")
      .replace(/[•·•]/g, "\n");

    let parts = normalized
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .flatMap((line) =>
        line
          .split(/[,;:—–|]+/)
          .map((p) => p.trim())
          .filter(Boolean)
      );

    const unique = Array.from(new Set(parts)).slice(0, 20); // LIMIT TO 20 NODES

    const fetchPromises = unique.map((label) =>
      fetchImage(label).then((img) => ({ label, image: img }))
    );

    const results = await Promise.all(fetchPromises);

    const newNodes = [];
    const cols = 3;
    const xGap = 220;
    const yGap = 180;

    results.forEach((r, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      newNodes.push({
        id: `${i}-${r.label}`,
        label: r.label,
        image: r.image,
        x: 40 + col * xGap,
        y: 40 + row * yGap,
      });
    });

    setNodes(newNodes);
  } catch (err) {
    console.error("generateMindMapFromText error:", err);
    alert("Something went wrong while generating the map. Check console.");
  } finally {
    setLoading(false);
  }
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
  disabled={loading}
>
  {loading ? "Generating…" : "Generate Mind Map"}
</button>


          <MindMap nodes={nodes} />
        </>
      )}

      {mode === "pdf" && <PdfViewer />}
    </div>
  );
}
