import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService } from '../product.service';
import { FileUploadService } from '../file-upload.service';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit {
  productForm: FormGroup;
  selectedFile: File | null = null;
  productId: number = 0;
  imagePath: string | null = null;
  imageUrl: string | null = null;
  currentImagePath: string | null = null;
  submitted: boolean = false; 

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private fileUploadService: FileUploadService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.productForm = this.fb.group({
      id: [0],
      productName: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      price: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
      category: ['', Validators.required],
      //ImagePath:['', Validators.required]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.productId = +id; 
      this.getProduct();
    } else {
      console.error('Product ID not found in route parameters');
      this.router.navigate(['/products']);
    }
  }

  getProduct() {
    this.productService.getProductById(this.productId).subscribe((product: any) => {
      this.productForm.patchValue(product);
      const baseUrl = 'https://localhost:7281/'; 
      if (product.imagePath) {
        this.imageUrl = `${baseUrl}${product.imagePath}`;
        this.currentImagePath = product.imagePath;
        console.warn(this.imageUrl);
      }
    });
  }

  onFileChange(event: any) {
    this.selectedFile = event.target.files[0];
  }

  onSubmit() {
    this.submitted = true; 

    if (this.productForm.valid) {
      const productData = this.productForm.value;

      if (this.selectedFile) {
        this.fileUploadService.uploadFileInChunks(this.selectedFile).subscribe(
          (result) => {
            if (typeof result === 'number') {
              console.log(`Upload Progress: ${result}%`);
            } else if (typeof result === 'string') {
              productData.imagePath = result; 
              this.productService.updateProduct(productData.id, productData).subscribe(() => {
                this.router.navigate(['/products']);
              });
            }
          },
          (error) => {
            alert('File upload failed');
          }
        );
      } else if (this.imageUrl) {
        productData.imagePath = this.currentImagePath;
        this.productService.updateProduct(productData.id, productData).subscribe(() => {
          this.router.navigate(['/products']);
        });
      } else {
        alert('Please select a file to upload or ensure an existing file is available.');
      }
    } else {
      alert('Please fill all required fields.');
    }
  }
}
