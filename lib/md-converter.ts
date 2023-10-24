import { parse } from "./parser/index";
import { compileToMermaid } from "./compiler";
import { renderMermaid } from "./renderer";

const threatdownRegex = /```threatdown([\s\S]*?)```/g;
const getMermaid = async (mermaidFormatedData: string): Promise<string> => {
  const testSvg = await renderMermaid(mermaidFormatedData);
  return testSvg;
};

// Define an asynchronous function to process each match
const processMatchAsync = async (match: string, mdEmbeddedType: string) => {
  const cleanMatch = match
    .trim()
    .replace(/^```threatdown/, "")
    .replace(/```$/, "");
  const jsonFormatedData = parse(cleanMatch);
  const mermaidData = compileToMermaid(jsonFormatedData);
  const mermaidSvg = await getMermaid(mermaidData);

  return (
    `<!-- ${match} --> \n` +
    // Render JSON
    `${
      mdEmbeddedType === "json"
        ? "## JSON \n" +
          "```json\n" +
          JSON.stringify(jsonFormatedData) +
          "\n```\n"
        : ""
    }` +
    // Render Mermaid
    `${
      mdEmbeddedType === "mermaid"
        ? "## MERMAID \n" + "```mermaid\n" + mermaidData + "\n```\n"
        : ""
    }` +
    // Render SVG
    `${mdEmbeddedType === "svg" ? "## SVG \n" + "\n" + mermaidSvg + "\n" : ""}`
  );
};

// generate the updated markdown file
export const generateUpdatedMd = async (file: string, mdEmbeddedType: string) => {
  try {
    const threatdownMatches = file.match(threatdownRegex);

    if (!threatdownMatches) {
      throw new Error("No threatdown content found");
    }

    const newFilePromises = threatdownMatches.map((match) =>
      processMatchAsync(match, mdEmbeddedType)
    );
    const newFileContentArray = await Promise.all(newFilePromises);

    let newFile = file;
    for (let i = 0; i < threatdownMatches.length; i++) {
      newFile = newFile.replace(threatdownMatches[i], newFileContentArray[i]);
    }

    return newFile;
  } catch (err) {
    console.error(err);
    throw err;
  }
};
