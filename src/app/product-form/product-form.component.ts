import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService } from '../product.service';
import { FileUploadService } from '../file-upload.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-product-form',
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.css']
})
export class ProductFormComponent implements OnInit {
  productForm: FormGroup;
  selectedFile: File | null = null;
  submitted: boolean = false; 
  fileError: string | null = null; 

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private fileUploadService: FileUploadService,
    private router: Router
  ) {
    this.productForm = this.fb.group({
      id: [0],
      productName: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      price: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
      category: ['', Validators.required],
      //file: [this.selectedFile, Validators.required], 
    });
  }

  ngOnInit(): void {}

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
      if (allowedTypes.includes(file.type)) {
        this.selectedFile = file;
        this.fileError = null; 
      } else {
        this.selectedFile = null; 
        this.fileError = 'Only image files are allowed (JPEG, PNG, GIF).'; 
      }
    }
  }


  onSubmit() {
    this.submitted = true; 

    if (this.productForm.valid && this.selectedFile) {
      const productData = this.productForm.value;
      this.fileUploadService.uploadFileInChunks(this.selectedFile).subscribe(
        (result) => {
          if (typeof result === 'string') {
            productData.imagePath = result; 
            this.productService.createProduct(productData).subscribe(() => {
              this.router.navigate(['/products']);
            });
          }
        },
        (error) => {
          alert('File upload failed');
        }
      );
    } else {
      alert('Please fill all required fields and upload a file.');
    }
  }
}
