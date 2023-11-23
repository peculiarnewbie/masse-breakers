export type Message = {
	from: string;
	content: string;
	order: number;
	version: number;
};

export type MessageWithID = Message & { id: string };
