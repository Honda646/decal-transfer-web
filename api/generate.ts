import { GoogleGenAI, Type, Modality } from "@google/genai";

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const { action, payload } = await request.json();

    switch (action) {
      case 'analyzeHelmet1': {
        const { image } = payload;
        const imagePart = { inlineData: image };
        const schema = {
          type: Type.OBJECT,
          properties: {
            "helmetType": { "type": Type.STRING, "enum": ["half-face", "open-face", "fullface", "cross-mx"], "description": "Classify the helmet type." },
            "decalPromptEn": { "type": Type.OBJECT, "properties": { "theme": { "type": Type.STRING }, "motifs": { "type": Type.STRING }, "flow": { "type": Type.STRING }, "palette": { "type": Type.STRING }, "density": { "type": Type.STRING }, "finish": { "type": Type.STRING }, "typography": { "type": Type.STRING }, "mood": { "type": Type.STRING } } },
          }
        };
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: { parts: [imagePart, { text: "Analyze the image of a motorcycle helmet. Extract the decal design into structured fields in English (en). For the 'palette' field, accurately identify the main colors and provide their HEX codes, listing the most prominent colors first. Provide up to 6 HEX codes. If there are fewer than 6 distinct colors, use neutral grays like #808080 or repeat the primary colors to fill the remaining slots. Also, classify the helmet type. Provide your response as a JSON object matching the requested schema. Ensure all fields are filled; use 'N/A' or 'None' if a feature is not present." }] },
          config: { responseMimeType: "application/json", responseSchema: schema }
        });
        return new Response(JSON.stringify({ result: response.text }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      case 'analyzeHelmet2': {
        const { image } = payload;
        const imagePart = { inlineData: image };
        const schema = {
            type: Type.OBJECT,
            properties: { "helmetType": { "type": Type.STRING, "enum": ["half-face", "open-face", "fullface", "cross-mx"] } }
        };
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: "Classify the helmet type in the image. Respond with a JSON object matching the schema." }] },
            config: { responseMimeType: "application/json", responseSchema: schema }
        });
         return new Response(JSON.stringify({ result: response.text }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      case 'generateImage': {
        const { prompt } = payload;
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '1:1' }
        });
        const generatedImage = response.generatedImages?.[0]?.image;
        if (!generatedImage) throw new Error("The model did not generate an image.");
        const resultImageUrl = `data:image/jpeg;base64,${generatedImage.imageBytes}`;
        return new Response(JSON.stringify({ result: resultImageUrl }), {
            headers: { 'Content-Type': 'application/json' },
        });
      }

      case 'editImage': {
        const { image, prompt, model = 'gemini-2.5-flash-image' } = payload;
        const imagePart = { inlineData: image };
        const textPart = { text: prompt };

        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: [imagePart, textPart] },
            config: { responseModalities: [Modality.IMAGE, Modality.TEXT] }
        });

        const imageOutput = response.candidates?.[0].content.parts.find(p => p.inlineData);
        if (!imageOutput?.inlineData) throw new Error("The model did not return an image.");
        
        const resultImageUrl = `data:${imageOutput.inlineData.mimeType};base64,${imageOutput.inlineData.data}`;
         return new Response(JSON.stringify({ result: resultImageUrl }), {
            headers: { 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
    }

  } catch (error: any) {
     console.error(error);
     return new Response(JSON.stringify({ error: error.message || 'An unknown error occurred on the server.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
     });
  }
}
