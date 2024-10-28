import { Injectable } from '@angular/core';
import { HttpClient, HttpEventType, HttpHeaders, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private uploadUrl = 'https://localhost:7281/api/product';

  constructor(private http: HttpClient) {}

  uploadFileInChunks(file: File, chunkSize: number = 1024 * 512): Observable<any> {
    const totalChunks = Math.ceil(file.size / chunkSize);
    let uploadedSize = 0;

    const uploadChunk = (index: number): Observable<any> => {
        const start = index * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append('file', chunk, file.name); // Ensure this matches the API's parameter name
        formData.append('fileName', file.name); // Include the file name
        formData.append('chunkIndex', index.toString()); // Current chunk index
        formData.append('totalChunks', totalChunks.toString()); // Total number of chunks

        return this.http.post(`${this.uploadUrl}/upload`, formData, { reportProgress: true, observe: 'events' });
    };

    return new Observable((observer) => {
        const uploadNext = (index: number) => {
            if (index < totalChunks) {
                uploadChunk(index).subscribe(
                    (event) => {
                        if (event.type === HttpEventType.UploadProgress && event.total) {
                            uploadedSize += event.loaded;
                            observer.next(Math.round((uploadedSize / file.size) * 100));
                        } else if (event.type === HttpEventType.Response) {
                            // If the last chunk has been uploaded, retrieve the file path
                            if (index === totalChunks - 1) {
                                observer.next(event.body.filePath); // Emit file path
                                observer.complete(); // Complete the observable
                            } else {
                                uploadNext(index + 1); // Upload the next chunk
                            }
                        }
                    },
                    (error) => {
                        console.error(`Chunk upload failed at index ${index}:`, error);
                        observer.error(error); // Emit error if chunk upload fails
                    }
                );
            } else {
                observer.complete(); // Complete the observable if all chunks are uploaded
            }
        };

        uploadNext(0); // Start uploading from the first chunk
    });
}


// New method to get the file path after upload
getFilePath(fileName: string): Observable<any> {
  return this.http.get(`${this.uploadUrl}/get-file-path/${fileName}`);
}


}
