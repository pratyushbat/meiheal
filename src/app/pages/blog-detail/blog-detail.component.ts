import { Component, computed, effect, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SeoService } from '../../services/seo.service';
import { BlogService } from '../../services/blog.service';
import { BlogPost, Comment } from '../../models/blog.model';
import { CommonModule, DatePipe, isPlatformBrowser } from '@angular/common';
import { Meta } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';



@Component({
  selector: 'blog-detail',
  templateUrl: './blog-detail.component.html',
  styleUrls: ['./blog-detail.component.scss'],
  standalone: true,
  imports:[FormsModule,DatePipe,RouterModule,CommonModule]
})
export class BlogDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private seoService = inject(SeoService);
  private _blogService = inject(BlogService);
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);

  currentPostSlug: string = '';
  categoryISlug: string = '';


  private data = toSignal(this.route.data, { requireSync: true });
  currentblogDetail = computed(() => this.data().blogDetail as BlogPost | null);
  comments: Comment[] = [];


  authorName: string = '';
  mainCommentText: string = '';
  replyText: string = '';

  activeReplyId: string | null = null;
  isSubmitting: boolean = false;


  title: string = '';
  description: string = '';
  image: string = '';

  private readonly seoEffect = effect(() => {
    const currBlog = this.currentblogDetail();


    this.callSeo(currBlog);
    if (!currBlog) return;

    this.callStructuredData(currBlog);

  });
  constructor(private meta: Meta) {
  }

  ngOnInit() {


    // if (isPlatformBrowser(this.platformId)) {
    //Note :can be removed
    this.currentPostSlug = this.route.snapshot.paramMap.get('slug') || '';
    this.categoryISlug = this.route.snapshot.paramMap.get('category') || '';
    // }


  }

  loadComments(blogId: string): void {
    this._blogService.getCommentsForBlog(blogId).subscribe({
      next: (data: any) => {
        this.comments = data;
      },
      error: (err) => this.comments = [],
    });
  }


  openReplyForm(commentId: string): void {
    this.activeReplyId = commentId;
    this.replyText = '';
  }
  cancelReply(): void {
    this.activeReplyId = null;
    this.replyText = '';
  }


  submitMainComment(): void {
    if (!this.authorName || !this.mainCommentText) return;
    this.isSubmitting = true;

    this._blogService
      .addComment(this.currentPostSlug, this.mainCommentText, this.authorName)
      .subscribe({
        next: (newComment: any) => {

          this.comments.unshift({ ...newComment, replies: [] });

          this.mainCommentText = '';
          this.isSubmitting = false;
        },
        error: (err) => {

          this.isSubmitting = false;
        },
      });
  }


  submitReply(parentCommentId: string): void {
    if (!this.authorName || !this.replyText) return;
    this.isSubmitting = true;

    this._blogService
      .addComment(this.currentPostSlug, this.replyText, this.authorName, parentCommentId)
      .subscribe({
        next: (newReply) => {

          const parentComment: any = this.comments.find((c) => c._id === parentCommentId);
          if (parentComment) {
            if (!parentComment.replies) parentComment.replies = [];
            parentComment.replies.push(newReply);
          }


          this.cancelReply();
          this.isSubmitting = false;
        },
        error: (err) => {

          this.isSubmitting = false;
        },
      });
  }


  callSeo(currBlogPost: BlogPost | null) {

    this.title = currBlogPost?.seoTitle || 'Nutrition Blog by Dietitians | meiheal Detician';
    this.description = currBlogPost?.seoDescription || 'Expert nutrition and wellness blogs from a dietitian and healthcare expertise';
    this.image = currBlogPost?.featuredImage || 'https://www.meiheal.com/landingth.webp';


    // this.seoService.updateSeoTags({
    //   title: this.title,
    //   description: this.description,
    //   url: currBlogPost?.slug ? `https://www.meiheal.com/blogs/${currBlogPost?.category.slug}/${currBlogPost?.slug}` : `https://www.meiheal.com${this.router.url.split('?')[0]}`,
    //   image: this.image
    // });



    this.meta.updateTag({
      name: 'twitter:card',
      content: 'summary_large_image'
    });

    this.meta.updateTag({
      name: 'twitter:title',
      content: this.title
    });

    this.meta.updateTag({
      name: 'twitter:description',
      content: this.description
    });

    this.meta.updateTag({
      name: 'twitter:image',
      content: this.image
    });

    this.meta.updateTag({
      name: 'twitter:url',
      content: `https://www.meiheal.com${this.router.url}`
    });

    // Optional
    this.meta.updateTag({
      name: 'twitter:site',
      content: '@meiheal'
    });

    this.meta.updateTag({
      name: 'twitter:creator',
      content: '@meiheal'
    });
  }


  callStructuredData(currBlogPost: BlogPost) {

    // this.seoService.setStructuredData({
    //   "@context": "https://schema.org",
    //   "@type": "BlogPosting",
    //   "headline": this.title,
    //   "url": currBlogPost?.slug ? `https://www.meiheal.com/blogs/${currBlogPost?.category.slug}/${currBlogPost?.slug}` : `https://www.meiheal.com${this.router.url.split('?')[0]}`,
    //   "image": this.image,
    //   "datePublished": currBlogPost?.createdAt ? new Date(currBlogPost.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : undefined,
    //   "dateModified": currBlogPost?.updatedAt ? new Date(currBlogPost.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : undefined,
    //   "description": this.description,
    //   "author": {
    //     "@type": "Person",
    //     "name": "meiheal"
    //   },
    //   "publisher": {
    //     "@type": "MedicalBusiness",
    //     "name": "Mei Heal",
    //     "url": "https://www.meiheal.com",
    //     "logo": {
    //       "@type": "ImageObject",
    //       "url": "https://www.meiheal.com/images/dlogob.webp"
    //     },
    //     "telephone": "+91-9354999067",
    //     "sameAs": [
    //       "https://www.facebook.com/profile.php?id=61590369990172",
    //       "https://instagram.com/dietwith_meiheal",
    //       "https://www.linkedin.com/in/meiheal",
    //       "https://www.youtube.com/@meiheal",
    //       "https://x.com/meiheal"
    //     ]
    //   },
    //   "mainEntityOfPage": {
    //     "@type": "WebPage",
    //     "@id": `https://www.meiheal.com/blogs/${currBlogPost?.category.slug}/${currBlogPost?.slug}`
    //   }
    // });

  }
}


