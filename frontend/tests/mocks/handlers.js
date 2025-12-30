import { http, HttpResponse } from 'msw';
export const handlers = [
    http.post('http://localhost:3001/api/analyze', () => {
        return HttpResponse.json({ success: true, schema: [] });
    })
];
