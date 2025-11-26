import { Component, OnInit } from '@angular/core';
import { CategoryService } from '../../core/services/category.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class CategoriesComponent implements OnInit {
  categories: any[] = [];

  // form model – includes optional budget limit + colour
  category: any = {
    id: null,
    name: '',
    budget_limit: null,
    color: '#4f46e5',
  };

  constructor(private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe((data) => {
      this.categories = data || [];
    });
  }

  onSubmit(): void {
    const payload = { ...this.category };

    if (payload.id) {
      this.categoryService.updateCategory(payload).subscribe(() => {
        this.resetForm();
        this.loadCategories();
      });
    } else {
      this.categoryService.createCategory(payload).subscribe(() => {
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
    this.category = {
      id: null,
      name: '',
      budget_limit: null,
      color: '#4f46e5',
    };
  }
}
