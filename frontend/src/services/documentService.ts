import api from './api'
import type { DocumentListResponse } from '../types/api'
import type { Notebook } from '../types/notebook'

export async function listDocuments() {
	const response = await api.get<DocumentListResponse>('/api/documents')
	return response.data
}

export async function getNotebookDocuments(notebookId: string) {
	const response = await api.get<Notebook>(`/api/notebooks/${notebookId}/documents`)
	return response.data
}

// Updated to use the simplified backend endpoint that only requires file_id
export async function deleteDocument(fileId: string) {
	await api.delete(`/api/documents/${fileId}`)
}