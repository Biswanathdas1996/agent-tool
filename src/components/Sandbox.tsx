import React, { useState } from "react";

const CreateSandboxButton = () => {
  const [sandboxUrl, setSandboxUrl] = useState<string | null>(null);

  const createSandbox = async () => {
    const sandboxData = {
      files: {
        "index.js": {
          content: `console.log('Hello, CodeSandbox!');`,
        },
        "package.json": {
          content: JSON.stringify({
            dependencies: {
              react: "^18.0.0",
              "react-dom": "^18.0.0",
            },
          }),
        },
      },
    };

    const response = await fetch(
      "https://codesandbox.io/api/v1/sandboxes/define?json=1",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sandboxData),
      }
    );

    const data = await response.json();
    setSandboxUrl(`https://codesandbox.io/s/${data.sandbox_id}`);
  };

  return (
    <div>
      <button onClick={createSandbox}>Create Sandbox</button>
      {sandboxUrl && (
        <p>
          Sandbox created:{" "}
          <a href={sandboxUrl} target="_blank" rel="noreferrer">
            {sandboxUrl}
          </a>
        </p>
      )}
    </div>
  );
};

export default CreateSandboxButton;
