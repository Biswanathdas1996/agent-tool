import * as React from "react";
import Box from "@mui/material/Box";
import { TreeViewBaseItem } from "@mui/x-tree-view/models";
import { RichTreeView } from "@mui/x-tree-view/RichTreeView";

const jsonData = {
  result: {
    "": {
      dirs: ["src"],
      files: [
        ".babelrc",
        ".gitignore",
        "package-lock.json",
        "package.json",
        "tsconfig.json",
        "webpack.config.js",
        "yarn.lock",
      ],
    },
    src: {
      dirs: [
        "components",
        "css",
        "hook",
        "layout",
        "mock",
        "pages",
        "redux",
        "types",
      ],
      files: ["App.css", "App.tsx", "config.ts", "index.html", "index.tsx"],
    },
    // Add the remaining JSON data here...
  },
};

const transformToTreeViewItems = (
  data: any,
  parentKey = ""
): TreeViewBaseItem[] => {
  const items: TreeViewBaseItem[] = [];

  for (const key in data) {
    const node = data[key];
    const id = parentKey ? `${parentKey}/${key}` : key || "root";
    const label = key || "Root";

    // Safely get directories and files, defaulting to empty arrays
    const dirs = node?.dirs || [];
    const files = node?.files || [];

    const children: TreeViewBaseItem[] = [
      ...dirs
        .map((dir: string) =>
          transformToTreeViewItems({ [dir]: data[`${id}\\${dir}`] }, id)
        )
        .flat(),
      ...files.map((file: string) => ({
        id: `${id}\\${file}`,
        label: file,
      })),
    ];

    items.push({
      id,
      label,
      children: children.length > 0 ? children : undefined,
    });
  }

  return items;
};

interface JsonDataNode {
  dirs?: string[];
  files?: string[];
}

interface JsonData {
  result: {
    [key: string]: JsonDataNode;
  };
}

interface TransformToTreeViewItems {
  (data: JsonDataNode, parentKey?: string): TreeViewBaseItem[];
}

export default function BasicRichTreeView({ data }: any) {
  console.log(data);
  const treeViewItems = transformToTreeViewItems(data);
  return (
    <Box sx={{ minWidth: 350 }}>
      <RichTreeView items={treeViewItems} />
    </Box>
  );
}
