import api from './api'
import type { UploadResponse } from '../types/api'

export async function uploadPdf(notebookId: string, file: File, onProgress?: (progress: number) => void) {
	const formData = new FormData()
	formData.append('file', file)
	const response = await api.post<UploadResponse>(`/api/notebooks/${notebookId}/upload-pdf`, formData, {
		onUploadProgress: (event) => {
			if (event.total) onProgress?.(Math.round((event.loaded / event.total) * 100))
		},
	})
	return response.data
}
