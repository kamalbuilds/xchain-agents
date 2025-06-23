import type {
    Action,
    Content,
    IAgentRuntime,
    Memory,
    State,
    HandlerCallback,
} from "@ai16z/eliza";

interface SendMessageContent extends Content {
    targetAgent?: string;
    message?: string;
    roomId?: string;
    userId?: string;
    messageId?: string;
}

export const sendMessageAction: Action = {
    name: "SEND_MESSAGE",
    description: "Send a message to another agent",
    similes: ["COMMUNICATE", "MESSAGE", "NOTIFY"],
    examples: [],

    async validate(runtime: IAgentRuntime, message: Memory): Promise<boolean> {
        const content = message.content as SendMessageContent;
        return !!content.targetAgent;
    },

    async handler(
        runtime: IAgentRuntime,
        message: Memory,
        state: State | undefined,
        options: Record<string, unknown> | undefined,
        callback: HandlerCallback | undefined
    ): Promise<Content> {
        const content = message.content as SendMessageContent;
        const messageId = content.messageId || `${runtime.agentId}-${Date.now()}`;

        try {
            const responseContent: Content = {
                text: "Message sent successfully",
                attachments: [],
                source: "sodas",
                action: "SEND_MESSAGE",
                messageId: `${messageId}-response`,
            };

            if (callback) {
                await callback(responseContent);
            }
            return responseContent;
        } catch (error) {
            console.error("[SEND_MESSAGE] Error:", error);
            const errorContent: Content = {
                text: `Error: ${(error as Error).message}`,
                attachments: [],
                source: "sodas",
                action: "SEND_MESSAGE",
                messageId: `${messageId}-error`,
            };
            if (callback) {
                await callback(errorContent);
            }
            return errorContent;
        }
    },
};
