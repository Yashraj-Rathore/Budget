import { Component, OnInit } from '@angular/core';
import { CategoryService } from '../services/category.service';
import { FormsModule } from '@angular/forms'; // Import FormsModule
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]  // Add FormsModule to imports
})
export class CategoriesComponent implements OnInit {
  categories: any[] = [];
  category: any = { name: '' };

  constructor(private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe((data) => {
      this.categories = data;
    });
  }

  onSubmit(): void {
    if (this.category.id) {
      this.categoryService.updateCategory(this.category).subscribe(() => {
        this.resetForm();
        this.loadCategories();
      });
    } else {
      this.categoryService.createCategory(this.category).subscribe(() => {
        this.resetForm();
        this.loadCategories();
      });
    }
  }

  editCategory(cat: any): void {
    this.category = { ...cat };
  }

  deleteCategory(id: number): void {
    this.categoryService.deleteCategory(id).subscribe(() => {
      this.loadCategories();
    });
  }

  resetForm(): void {
    this.category = { name: '' };
  }
}
