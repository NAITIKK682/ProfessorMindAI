export interface QuestionRequest {
	notebook_id: string
	question: string
	top_k?: number
}

export interface ChatSource {
	file_id: string
	page_number: number
	chunk_index: number
	text: string
	distance: number
}

export interface QuestionResponse {
	question: string
	answer: string
	sources: ChatSource[]
}
