# Schema Recommendations for AI Visibility

**Purpose:** Recommend schema types and provide generic templates for GameLayer  
**Last Updated:** 2025-01-XX

**Note:** These are GENERIC TEMPLATES ONLY. Do not attach schemas to real pages without review and customization. All values are placeholders.

---

## Recommended Schema Types

### 1. Organization Schema
**Use Case:** Homepage, About page, Footer  
**Purpose:** Establish company identity, credibility, and contact information

### 2. SoftwareApplication Schema
**Use Case:** Homepage  
**Purpose:** Define GameLayer as a software application with features, pricing, and capabilities

### 3. Product Schema (Alternative to SoftwareApplication)
**Use Case:** Homepage, Pricing section  
**Purpose:** Define GameLayer as a product with offers and pricing

### 4. Article / BlogPosting Schema
**Use Case:** Blog posts, individual articles  
**Purpose:** Enable rich snippets for blog content, improve search visibility

### 5. FAQPage Schema
**Use Case:** Homepage, Blog posts, API docs (when FAQs are added)  
**Purpose:** Enable FAQ rich snippets, improve AI visibility

### 6. BreadcrumbList Schema
**Use Case:** All pages  
**Purpose:** Improve navigation understanding, enable breadcrumb rich snippets

### 7. WebSite Schema
**Use Case:** Homepage  
**Purpose:** Site-wide information, search action

### 8. TechArticle Schema
**Use Case:** API documentation  
**Purpose:** Mark technical documentation for better search visibility

---

## Generic Schema Templates

### 1. Organization Schema

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "[Organization Name]",
  "url": "https://gamelayer.io",
  "logo": "[Logo URL]",
  "description": "[Organization Description]",
  "foundingDate": "[Year]",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "[Country Code]",
    "addressLocality": "[City]"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "[Email Address]",
    "contactType": "customer service"
  },
  "sameAs": [
    "[Social Media URLs]"
  ]
}
```

**Fields to Customize:**
- `name`: "GameLayer"
- `description`: Company description
- `foundingDate`: Actual founding year
- `address`: Actual address information
- `contactPoint.email`: Actual contact email
- `sameAs`: Actual social media URLs
- `logo`: Actual logo URL

---

### 2. SoftwareApplication Schema

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "[Application Name]",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "[Price]",
    "priceCurrency": "[Currency Code]"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "[Rating]",
    "reviewCount": "[Count]"
  },
  "description": "[Application Description]",
  "featureList": [
    "[Feature 1]",
    "[Feature 2]",
    "[Feature 3]"
  ],
  "screenshot": "[Screenshot URL]",
  "softwareVersion": "[Version]",
  "url": "https://gamelayer.io"
}
```

**Fields to Customize:**
- `name`: "GameLayer"
- `applicationCategory`: Appropriate category (e.g., "DeveloperApplication", "BusinessApplication")
- `description`: Platform description
- `featureList`: List of key features (missions, achievements, streaks, etc.)
- `offers`: Pricing information (multiple offers for different plans)
- `aggregateRating`: If reviews/ratings are available
- `screenshot`: Platform screenshot URL
- `softwareVersion`: Current version if applicable

**Note:** Consider using multiple `offers` for different pricing tiers (Starter, Growth, Scale).

---

### 3. Product Schema (Alternative)

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "[Product Name]",
  "description": "[Product Description]",
  "brand": {
    "@type": "Brand",
    "name": "[Brand Name]"
  },
  "category": "[Product Category]",
  "offers": {
    "@type": "AggregateOffer",
    "offerCount": "[Number of Offers]",
    "lowPrice": "[Lowest Price]",
    "highPrice": "[Highest Price]",
    "priceCurrency": "[Currency Code]",
    "offers": [
      {
        "@type": "Offer",
        "name": "[Plan Name]",
        "price": "[Price]",
        "priceCurrency": "[Currency Code]",
        "description": "[Plan Description]"
      }
    ]
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "[Rating]",
    "reviewCount": "[Count]"
  }
}
```

**Fields to Customize:**
- `name`: "GameLayer"
- `description`: Product description
- `brand.name`: "GameLayer"
- `category`: Appropriate category
- `offers`: Pricing tiers (Starter, Growth, Scale)
- `aggregateRating`: If reviews/ratings are available

**Note:** Use `AggregateOffer` to represent multiple pricing tiers.

---

### 4. Article / BlogPosting Schema

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "[Article Title]",
  "description": "[Article Description]",
  "author": {
    "@type": "Person",
    "name": "[Author Name]"
  },
  "publisher": {
    "@type": "Organization",
    "name": "[Publisher Name]",
    "logo": {
      "@type": "ImageObject",
      "url": "[Logo URL]"
    }
  },
  "datePublished": "[ISO 8601 Date]",
  "dateModified": "[ISO 8601 Date]",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "[Article URL]"
  },
  "image": "[Article Image URL]",
  "articleBody": "[Article Content]"
}
```

**Fields to Customize:**
- `headline`: Actual article title
- `description`: Article meta description or excerpt
- `author.name`: Actual author name
- `publisher.name`: "GameLayer"
- `publisher.logo.url`: Actual logo URL
- `datePublished`: Actual publication date (ISO 8601)
- `dateModified`: Last modification date (ISO 8601)
- `mainEntityOfPage.@id`: Actual article URL
- `image`: Article featured image URL
- `articleBody`: Article content (can be truncated for long articles)

**Note:** For blog listing pages, use `Blog` schema with `blogPost` array.

---

### 5. FAQPage Schema

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "[Question Text]",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[Answer Text]"
      }
    },
    {
      "@type": "Question",
      "name": "[Question Text]",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[Answer Text]"
      }
    }
  ]
}
```

**Fields to Customize:**
- `mainEntity`: Array of Question/Answer pairs
- Each question should be a complete, natural question
- Each answer should be comprehensive but concise
- Answers should be factual and accurate
- Answers can include links to relevant content

**Note:** 
- Minimum 2 questions required for FAQPage schema
- Questions should be actual user questions
- Answers should be developed based on existing content
- See `/seo/ai-visibility/faq-topic-recommendations.md` for question suggestions

---

### 6. BreadcrumbList Schema

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "[Breadcrumb Level 1]",
      "item": "[URL for Level 1]"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "[Breadcrumb Level 2]",
      "item": "[URL for Level 2]"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "[Breadcrumb Level 3]",
      "item": "[URL for Level 3]"
    }
  ]
}
```

**Fields to Customize:**
- `itemListElement`: Array of breadcrumb items
- Each item should represent a navigation level
- `position`: Sequential number starting from 1
- `name`: Display text for breadcrumb
- `item`: Full URL for breadcrumb level

**Example for Blog Post:**
- Position 1: "Home" → "https://gamelayer.io"
- Position 2: "Blog" → "https://gamelayer.io/blog"
- Position 3: "Article Title" → "https://gamelayer.io/blog/article-slug"

---

### 7. WebSite Schema

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "[Site Name]",
  "url": "https://gamelayer.io",
  "description": "[Site Description]",
  "publisher": {
    "@type": "Organization",
    "name": "[Publisher Name]"
  },
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "[Search URL Template]"
    },
    "query-input": "required name=search_term_string"
  }
}
```

**Fields to Customize:**
- `name`: "GameLayer"
- `description`: Site description
- `publisher.name`: "GameLayer"
- `potentialAction.target.urlTemplate`: Search URL template (if site search exists)

**Note:** `potentialAction` is optional and only needed if site search functionality exists.

---

### 8. TechArticle Schema

```json
{
  "@context": "https://schema.org",
  "@type": "TechArticle",
  "headline": "[Article Title]",
  "description": "[Article Description]",
  "author": {
    "@type": "Organization",
    "name": "[Author Organization]"
  },
  "publisher": {
    "@type": "Organization",
    "name": "[Publisher Name]",
    "logo": {
      "@type": "ImageObject",
      "url": "[Logo URL]"
    }
  },
  "datePublished": "[ISO 8601 Date]",
  "dateModified": "[ISO 8601 Date]",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "[Article URL]"
  },
  "about": [
    {
      "@type": "Thing",
      "name": "[Topic 1]"
    },
    {
      "@type": "Thing",
      "name": "[Topic 2]"
    }
  ]
}
```

**Fields to Customize:**
- `headline`: Article/documentation title
- `description`: Article description
- `author.name`: "GameLayer" (for API docs)
- `publisher.name`: "GameLayer"
- `datePublished`: Publication date (ISO 8601)
- `dateModified`: Last modification date (ISO 8601)
- `mainEntityOfPage.@id`: Article URL
- `about`: Array of topics covered (e.g., "Gamification API", "User Engagement", "API Integration")

**Use Case:** API documentation pages

---

## Schema Implementation Guidelines

### 1. Choose Appropriate Schema Type
- **SoftwareApplication** vs **Product**: Use SoftwareApplication for developer-focused positioning, Product for business-focused positioning. GameLayer may benefit from SoftwareApplication given API focus.

### 2. Avoid Duplicate Schemas
- Don't use multiple competing schemas on the same page
- Choose the most appropriate schema type per page

### 3. Keep Data Accurate
- All schema data must match actual page content
- Update schema when content changes
- Ensure dates, prices, and other data are current

### 4. Test Schema Markup
- Use Google's Rich Results Test: https://search.google.com/test/rich-results
- Use Schema.org validator: https://validator.schema.org/
- Verify structured data in Search Console

### 5. Implement Gradually
- Start with Organization and WebSite schemas (homepage)
- Add BlogPosting schema to blog posts
- Add FAQPage schema when FAQs are ready
- Add BreadcrumbList schema to all pages

### 6. Monitor Performance
- Track rich snippet appearances in Search Console
- Monitor click-through rates for pages with schema
- Adjust schema based on performance data

---

## Page-Specific Recommendations

### Homepage (`/`)
- **Organization Schema** (required)
- **WebSite Schema** (recommended)
- **SoftwareApplication Schema** OR **Product Schema** (choose one)
- **BreadcrumbList Schema** (recommended)
- **FAQPage Schema** (if FAQs are added)

### Blog Listing (`/blog`)
- **Blog Schema** (recommended)
- **BreadcrumbList Schema** (recommended)

### Blog Posts (`/blog/[slug]`)
- **BlogPosting Schema** (required)
- **BreadcrumbList Schema** (recommended)
- **FAQPage Schema** (if FAQs are included in post)

### API Docs (`/api-docs`)
- **TechArticle Schema** (recommended)
- **BreadcrumbList Schema** (recommended)
- **FAQPage Schema** (if FAQs are added)

---

## Notes

- These are **GENERIC TEMPLATES ONLY**
- All values marked with `[Brackets]` must be replaced with actual data
- Do not implement schemas without reviewing and customizing templates
- Schema implementation should align with existing content
- Test all schema markup before deployment
- Monitor schema performance in Search Console
- Update schemas when content changes
- Consider using a schema generator tool for complex implementations
