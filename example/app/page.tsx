"use client";

import { useRef } from "react";
import { useChat } from "ai/react";
import { FunctionCallHandler, Message, nanoid } from "ai";
import type { JSX } from "react";
import clsx from "clsx";
import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Textarea from "react-textarea-autosize";
import { Collapse } from "./collapse";
import { LoadingCircle, SendIcon } from "./icons";
import { createEsbuilder } from "../../dist/esm/esbuild";

const [esbuild] = createEsbuilder();

const examples = [
  "Create a JavaScript function that finds the highest number in an array.",
  "Develop a simple JSX component that takes in a user's name as a prop and displays a personalized greeting.",
  "Build a simple TypeScript function that adds two numbers together and includes type checking.",
  "Create a basic TSX React component for a ToDo item, it should have properties for the task name and a boolean to represent if it is completed or not, and should render accordingly."
];

export default function Chat() {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const functionCallHandler: FunctionCallHandler = async (
    chatMessages,
    functionCall,
  ) => {
    let parsedFunctionCallArguments = {} as any;
    const { name, arguments: args } = functionCall;
    if (args) {
      parsedFunctionCallArguments = JSON.parse(args);
    }

    let result;
    let entryPoint = parsedFunctionCallArguments.entryPoint || "index.js";

    const compiledResult = await esbuild({ rawCode: parsedFunctionCallArguments.rawCode, entryPoint  });
    result = JSON.stringify(compiledResult);

    return {
      messages: [
        ...chatMessages,
        {
          id: nanoid(),
          name: functionCall.name,
          role: "function" as const,
          content: result,
        },
      ],
    };
  };

  const { messages, input, setInput, handleSubmit, isLoading } = useChat({
    experimental_onFunctionCall: functionCallHandler
  });

  const disabled = isLoading || input.length === 0;

  const roleUIConfig: {
    [key: string]: {
      avatar: JSX.Element;
      bgColor: string;
      avatarColor: string;
      // eslint-disable-next-line no-unused-vars
      dialogComponent: (message: Message) => JSX.Element;
    };
  } = {
    user: {
      avatar: <User width={20} />,
      bgColor: "bg-white",
      avatarColor: "bg-black",
      dialogComponent: (message: Message) => (
        <ReactMarkdown
          className="prose mt-1 w-full break-words prose-p:leading-relaxed"
          remarkPlugins={[remarkGfm]}
          components={{
            a: (props) => (
              <a {...props} target="_blank" rel="noopener noreferrer" />
            ),
          }}
        >
          {message.content}
        </ReactMarkdown>
      ),
    },
    assistant: {
      avatar: <Bot width={20} />,
      bgColor: "bg-gray-100",
      avatarColor: "bg-green-500",
      dialogComponent: (message: Message) => (
        <ReactMarkdown
          className="prose mt-1 w-full break-words prose-p:leading-relaxed"
          remarkPlugins={[remarkGfm]}
          components={{
            a: (props) => (
              <a {...props} target="_blank" rel="noopener noreferrer" />
            ),
          }}
        >
          {message.content}
        </ReactMarkdown>
      ),
    },
    function: {
      avatar: <div>⒡</div>,
      bgColor: "bg-gray-200",
      avatarColor: "bg-blue-500",
      dialogComponent: (message: Message) => (
        <div className="flex flex-col">
          <div>Result</div>
          <Collapse text={message.content} />
        </div>
      ),
    },
  };

  return (
    <main className="flex flex-col items-center justify-between pb-40">
      {messages.length > 0 ? (
        messages.map((message, i) => {
          return (
            <div
              key={i}
              className={clsx(
                "flex w-full items-center justify-center border-b border-gray-200 py-8",
                roleUIConfig[message.role].bgColor,
              )}
            >
              <div className="flex w-full max-w-screen-md items-start space-x-4 px-5 sm:px-0">
                <div
                  className={clsx(
                    "p-1.5 text-white",
                    roleUIConfig[message.role].avatarColor,
                  )}
                >
                  {roleUIConfig[message.role].avatar}
                </div>
                {message.content === "" &&
                message.function_call != undefined ? (
                  typeof message.function_call === "object" ? (
                    <div className="flex flex-col">
                      <div>
                        Using{" "}
                        <span className="font-bold">
                          {message.function_call.name}
                        </span>{" "}
                        ...
                      </div>
                      <div className="text-sm text-gray-500">
                        {message.function_call.arguments}
                      </div>
                    </div>
                  ) : (
                    <div>{message.function_call}</div>
                  )
                ) : (
                  roleUIConfig[message.role].dialogComponent(message)
                )}
              </div>
            </div>
          );
        })
      ) : (
        <div className="mx-5 mt-20 max-w-screen-md rounded-md border border-gray-200 sm:mx-0 sm:w-full">
          <div className="flex flex-col space-y-1 p-2 sm:p-10">
            <h1 className="text-lg font-semibold text-black">
              Welcome to ChatCodeTree!
            </h1>
            <p className="text-gray-500">
              This example runs esbuild to compile javascript and typescript in the browser using web assembly.
            </p>
          </div>
          <div className="flex flex-col space-y-4 border-t border-gray-200 bg-gray-50 p-7 sm:p-10">
            {examples.map((example, i) => (
              <button
                key={i}
                className="rounded-md border border-gray-200 bg-white px-5 py-3 text-left text-sm text-gray-500 transition-all duration-75 hover:border-black hover:text-gray-700 active:bg-gray-50"
                onClick={() => {
                  setInput(example);
                  inputRef.current?.focus();
                }}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="fixed bottom-0 flex w-full flex-col items-center space-y-3 bg-gradient-to-b from-transparent via-gray-100 to-gray-100 p-5 pb-3 sm:px-0">
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="relative w-full max-w-screen-md rounded-xl border border-gray-200 bg-white px-4 pb-2 pt-3 shadow-lg sm:pb-3 sm:pt-4"
        >
          <Textarea
            ref={inputRef}
            tabIndex={0}
            required
            rows={1}
            autoFocus
            placeholder="Send a message"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                formRef.current?.requestSubmit();
                e.preventDefault();
              }
            }}
            spellCheck={false}
            className="w-full pr-10 focus:outline-none"
          />
          <button
            data-umami-event="send message button"
            className={clsx(
              "absolute inset-y-0 right-3 my-auto flex h-8 w-8 items-center justify-center rounded-md transition-all",
              disabled
                ? "cursor-not-allowed bg-white"
                : "bg-green-500 hover:bg-green-600",
            )}
            disabled={disabled}
          >
            {isLoading ? (
              <LoadingCircle />
            ) : (
              <SendIcon
                className={clsx(
                  "h-4 w-4",
                  input.length === 0 ? "text-gray-300" : "text-white",
                )}
              />
            )}
          </button>
        </form>
      </div>
    </main>
  );
}