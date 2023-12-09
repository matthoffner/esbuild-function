import { Configuration, OpenAIApi } from "openai-edge";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { ChatCompletionFunctions } from 'openai';

// Create an OpenAI API client (that's edge friendly!)
const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(config);

export const runtime = "edge";

const functions: ChatCompletionFunctions[] = [
    {
      name: 'javaScriptCompiler',
      description: 'Compiles JavaScript, TypeScript, or JSX code within a chat interface using esbuild-wasm. Accepts raw code as input, and provides compiled output, facilitating real-time code execution and analysis in a chatbot environment.',
      parameters: {
        type: 'object',
        properties: {
          rawCode: {
            type: 'string',
            description: 'The raw code to be compiled. This can include JavaScript, TypeScript, or JSX code.'
          }
        },
        required: ['rawCode']
      }      
    }
];
  
export async function POST(req: Request) {
  const { messages, function_call } = await req.json()

  const response = await openai.createChatCompletion({
    model: 'gpt-4',
    stream: true,
    messages,
    functions,
    function_call
  })

  const stream = OpenAIStream(response)
  return new StreamingTextResponse(stream)
}