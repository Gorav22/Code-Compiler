import { useEffect, useState } from 'react';
import EditiorNavbar from '../components/EditiorNavbar';
import Editor from '@monaco-editor/react';
import { MdLightMode } from 'react-icons/md';
import { AiOutlineExpandAlt } from "react-icons/ai";
import { api_base_url } from '../helper';
import { useParams } from 'react-router-dom';

const Editior = () => {
  const [tab, setTab] = useState("html");
  const [isLightMode, setIsLightMode] = useState(localStorage.getItem("lightMode") === "true");
  const [isExpanded, setIsExpanded] = useState(false);
  const [htmlCode, setHtmlCode] = useState("<h1>Hello world</h1>");
  const [cssCode, setCssCode] = useState("body { background-color: #f4f4f4; }");
  const [jsCode, setJsCode] = useState("// some comment");

  const { projectID } = useParams();

  // Change theme and save to localStorage
  const changeTheme = () => {
    const editorNavbar = document.querySelector(".EditiorNavbar");
    if (isLightMode) {
      editorNavbar.style.background = "#141414";
      document.body.classList.remove("lightMode");
      setIsLightMode(false);
      localStorage.setItem("lightMode", "false");
    } else {
      editorNavbar.style.background = "gray";
      document.body.classList.add("lightMode");
      setIsLightMode(true);
      localStorage.setItem("lightMode", "true");
    }
  };

  const run = () => {
    const html = htmlCode;
    const css = `<style>${cssCode}</style>`;
    const js = `<script>${jsCode}</script>`;
    const iframe = document.getElementById("iframe");

    if (iframe) {
      iframe.srcdoc = html + css + js;
    }
  };

  useEffect(() => {
    setTimeout(() => {
      run();
    }, 200);
  }, [htmlCode, cssCode, jsCode]);

  useEffect(() => {
    fetch(api_base_url + "/getProject", {
      mode: "cors",
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: localStorage.getItem("userId"),
        projId: projectID 
      })
    })
      .then(res => res.json())
      .then(data => {
        setHtmlCode(data.project.htmlCode);
        setCssCode(data.project.cssCode);
        setJsCode(data.project.jsCode);
      });
  }, [projectID]);

  const downloadFile = () => {
    const combinedCode = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Combined Project</title>
          <style>
            ${cssCode}
          </style>
      </head>
      <body>
          ${htmlCode}
          <script>
            ${jsCode}
          </script>
      </body>
      </html>
    `;

    // Create a Blob for the combined code
    const blob = new Blob([combinedCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    // Create a download link and trigger click
    const link = document.createElement('a');
    link.href = url;
    link.download = 'project.html'; // Set the desired file name
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Revoke the object URL to release memory
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        fetch(api_base_url + "/updateProject", {
          mode: "cors",
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            userId: localStorage.getItem("userId"),
            htmlCode: htmlCode,
            projId: projectID,  
            cssCode: cssCode,   
            jsCode: jsCode      
          })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            alert("Project saved successfully");
          } else {
            alert("Something went wrong");
          }
        })
        .catch((err) => {
          console.error("Error saving project:", err);
          alert("Failed to save project. Please try again.");
        });
      }
    };
  
    window.addEventListener('keydown', handleKeyDown);
  
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [projectID, htmlCode, cssCode, jsCode]);

  return (
    <>
      <EditiorNavbar onDownload={downloadFile} /> 
      <div className="flex">
        <div className={`left w-[${isExpanded ? "100%" : "50%"}]`}>
          <div className="tabs flex items-center justify-between gap-2 w-full bg-[#1A1919] h-[50px] px-[40px]">
            <div className="tabs flex items-center gap-2">
              <div onClick={() => { setTab("html"); }} className="tab cursor-pointer p-[6px] bg-[#1E1E1E] px-[10px] text-[15px]">HTML</div>
              <div onClick={() => { setTab("css"); }} className="tab cursor-pointer p-[6px] bg-[#1E1E1E] px-[10px] text-[15px]">CSS</div>
              <div onClick={() => { setTab("js"); }} className="tab cursor-pointer p-[6px] bg-[#1E1E1E] px-[10px] text-[15px]">JavaScript</div>
            </div>

            <div className="flex items-center gap-2">
              <i className="text-[20px] cursor-pointer" onClick={changeTheme}><MdLightMode /></i>
              <i className="text-[20px] cursor-pointer" onClick={() => { setIsExpanded(!isExpanded); }}><AiOutlineExpandAlt /></i>
            </div>
          </div>

          {tab === "html" ? (
            <Editor
              onChange={(value) => {
                setHtmlCode(value || "");
                run();
              }}
              height="82vh"
              theme={isLightMode ? "vs-light" : "vs-dark"}
              language="html"
              value={htmlCode}
            />
          ) : tab === "css" ? (
            <Editor
              onChange={(value) => {
                setCssCode(value || "");
                run();
              }}
              height="82vh"
              theme={isLightMode ? "vs-light" : "vs-dark"}
              language="css"
              value={cssCode}
            />
          ) : (
            <Editor
              onChange={(value) => {
                setJsCode(value || "");
                run();
              }}
              height="82vh"
              theme={isLightMode ? "vs-light" : "vs-dark"}
              language="javascript"
              value={jsCode}
            />
          )}
        </div>

        {!isExpanded && (
          <iframe
            id="iframe"
            className="w-[50%] min-h-[82vh] bg-[#fff] text-black"
            title="output"
          />
        )}
      </div>
    </>
  );
};

export default Editior;