# Internal Linking Strategy

**Purpose:** Conceptual plan for how homepage sections, blog posts, and API docs should reinforce each other  
**Last Updated:** 2025-01-XX

**Note:** This is a **conceptual plan only**. No actual link insertions are recommended. This document outlines linking patterns and logic.

---

## Linking Philosophy

### AI-Friendly Linking Logic

1. **Definitions → Explanations → Implementation**
   - Homepage defines platform → Blog explains concepts → API docs provide implementation
   - Creates a logical knowledge hierarchy

2. **Concepts → Examples → Technical Details**
   - Blog explains concepts → Homepage shows examples → API docs provide technical details
   - Supports different learning styles and intents

3. **Problems → Solutions → Tools**
   - Blog identifies problems → Homepage presents solutions → API docs provide tools
   - Aligns with user journey stages

---

## Homepage Linking Strategy

### Homepage → Blog

**Anchor Text Patterns:**
- "Learn more about gamification" → `/blog`
- "Gamification best practices" → `/blog` (filtered by category if available)
- "Gamification strategies" → `/blog` (filtered by category if available)
- "Why gamification fails" → `/blog/[specific-post-slug]`
- "Gamification case studies" → `/blog` (filtered by category if available)
- "Gamification guide" → `/blog` (filtered by category if available)

**Contextual Linking:**
- Features section: Link to blog posts explaining specific mechanics
- Solutions section: Link to blog posts about industry use cases
- Reviews/metrics section: Link to blog posts about measuring gamification

**Conceptual Logic:**
- When homepage mentions a concept (e.g., "user engagement"), link to blog post that explains it
- When homepage mentions a mechanic (e.g., "missions"), link to blog post that explains the mechanic
- When homepage mentions an outcome (e.g., "retention"), link to blog post about achieving that outcome

---

### Homepage → API Docs

**Anchor Text Patterns:**
- "API documentation" → `/api-docs`
- "View API docs" → `/api-docs`
- "Get started with the API" → `/api-docs`
- "API integration guide" → `/api-docs`
- "Developer documentation" → `/api-docs`

**Contextual Linking:**
- Features section: Link to API docs for specific mechanic endpoints
- Hero/CTA section: Link to API docs for developers ready to implement
- Features section: "See API endpoints" → `/api-docs` (with anchor to specific section if possible)

**Conceptual Logic:**
- When homepage mentions a feature, provide path to API implementation
- When homepage targets developers, direct to API docs
- When homepage shows capabilities, link to technical documentation

---

### Homepage Internal (Section → Section)

**Anchor Text Patterns:**
- "View features" → `/#features`
- "See solutions" → `/#solutions`
- "View pricing" → `/#pricing`
- "Learn more" → `/#features` or `/#solutions` (context-dependent)

**Conceptual Logic:**
- Navigation links between sections
- CTA buttons directing to relevant sections
- Cross-references between related sections

---

## Blog Linking Strategy

### Blog → Homepage

**Anchor Text Patterns:**
- "GameLayer platform" → `/`
- "Gamification platform" → `/`
- "Try GameLayer" → `/`
- "GameLayer features" → `/#features`
- "See GameLayer in action" → `/#solutions`
- "GameLayer pricing" → `/#pricing`
- "Get started with GameLayer" → `/`

**Contextual Linking:**
- When blog post mentions a platform capability, link to homepage features section
- When blog post discusses use cases, link to homepage solutions section
- When blog post mentions pricing/ROI, link to homepage pricing section
- When blog post references GameLayer, link to homepage for platform overview

**Conceptual Logic:**
- Educational content → Commercial opportunity
- Concept explanation → Platform demonstration
- Problem identification → Solution presentation

---

### Blog → API Docs

**Anchor Text Patterns:**
- "API documentation" → `/api-docs`
- "GameLayer API" → `/api-docs`
- "API implementation" → `/api-docs`
- "See API endpoints" → `/api-docs`
- "API integration guide" → `/api-docs`

**Contextual Linking:**
- When blog post explains a mechanic, link to API docs for that mechanic
- When blog post discusses implementation, link to API docs
- When blog post mentions technical details, link to API docs
- When blog post targets developers, link to API docs

**Conceptual Logic:**
- Concept understanding → Technical implementation
- Strategy discussion → Technical execution
- Best practices → Technical reference

---

### Blog → Blog (Cross-Linking)

**Anchor Text Patterns:**
- "Related: [Topic]" → `/blog/[related-post-slug]`
- "Learn more about [concept]" → `/blog/[concept-post-slug]`
- "See also: [topic]" → `/blog/[related-post-slug]`
- "Previous post: [title]" → `/blog/[previous-post-slug]`
- "Next: [topic]" → `/blog/[next-post-slug]`

**Contextual Linking:**
- Link to related concepts (e.g., "gamification mechanics" → "gamification psychology")
- Link to deeper dives (e.g., "gamification overview" → "missions deep-dive")
- Link to related use cases (e.g., "e-commerce gamification" → "loyalty program gamification")
- Link to related strategies (e.g., "engagement strategies" → "retention strategies")

**Conceptual Logic:**
- Related topics → Related posts
- Overview → Deep-dive
- Concept → Application
- Problem → Solution

---

## API Docs Linking Strategy

### API Docs → Homepage

**Anchor Text Patterns:**
- "GameLayer platform" → `/`
- "Platform overview" → `/`
- "See all features" → `/#features`
- "View use cases" → `/#solutions`
- "Pricing information" → `/#pricing`
- "Get started" → `/`

**Contextual Linking:**
- When API docs mention platform capabilities, link to homepage
- When API docs reference use cases, link to solutions section
- When API docs mention pricing/plans, link to pricing section
- When API docs provide overview, link to homepage for full context

**Conceptual Logic:**
- Technical detail → Platform overview
- Implementation → Use case context
- Developer focus → Business context

---

### API Docs → Blog

**Anchor Text Patterns:**
- "Gamification best practices" → `/blog` (filtered by category if available)
- "Implementation guide" → `/blog/[implementation-post-slug]`
- "Gamification strategies" → `/blog` (filtered by category if available)
- "Learn more about [concept]" → `/blog/[concept-post-slug]`
- "Case studies" → `/blog` (filtered by category if available)

**Contextual Linking:**
- When API docs mention a concept, link to blog post explaining it
- When API docs reference best practices, link to relevant blog posts
- When API docs show examples, link to case study blog posts
- When API docs discuss implementation, link to strategy blog posts

**Conceptual Logic:**
- Technical implementation → Strategic context
- Code examples → Real-world applications
- API reference → Best practices

---

### API Docs Internal (Section → Section)

**Anchor Text Patterns:**
- "See [related endpoint]" → `/api-docs#endpoint-name`
- "Related: [feature]" → `/api-docs#feature-name`
- "Authentication" → `/api-docs#authentication`
- "Webhooks" → `/api-docs#webhooks`

**Conceptual Logic:**
- Cross-reference related endpoints
- Link to prerequisite information (e.g., authentication before endpoints)
- Link to related features (e.g., missions → achievements)

---

## Anchor Text Patterns (Not Mandates)

### Branded Anchor Text
- "GameLayer"
- "GameLayer platform"
- "GameLayer API"

### Descriptive Anchor Text
- "Gamification platform"
- "Gamification API"
- "User engagement platform"
- "Customer loyalty platform"

### Action-Oriented Anchor Text
- "Get started with GameLayer"
- "Try GameLayer"
- "View API documentation"
- "Learn more about gamification"
- "See gamification features"

### Concept-Based Anchor Text
- "Gamification best practices"
- "Gamification strategies"
- "User engagement strategies"
- "Gamification mechanics"
- "API implementation guide"

### Contextual Anchor Text
- "See how it works" (context-dependent)
- "Learn more" (context-dependent)
- "Related: [topic]" (context-dependent)

---

## Linking Density Guidelines

### Homepage
- **To Blog:** 3-5 contextual links
- **To API Docs:** 2-3 contextual links (developer-focused sections)
- **Internal:** Navigation and CTA links

### Blog Posts
- **To Homepage:** 2-4 contextual links
- **To API Docs:** 1-3 contextual links (when technical content is relevant)
- **To Other Blog Posts:** 2-5 contextual links (related content)

### API Docs
- **To Homepage:** 1-2 contextual links
- **To Blog:** 1-3 contextual links (when strategic context is relevant)
- **Internal:** Cross-references between endpoints and sections

---

## AI-Friendly Linking Logic

### Definition → Explanation → Implementation Flow

1. **Homepage defines** "What is GameLayer?"
2. **Blog explains** "How does gamification work?"
3. **API docs provide** "How to implement gamification"

**Linking Pattern:**
- Homepage → Blog (for explanations)
- Blog → API Docs (for implementation)
- API Docs → Blog (for context)
- API Docs → Homepage (for overview)

### Concept → Example → Technical Detail Flow

1. **Blog explains** "Gamification mechanics"
2. **Homepage shows** "GameLayer features"
3. **API docs provide** "API endpoints for mechanics"

**Linking Pattern:**
- Blog → Homepage (for examples)
- Homepage → API Docs (for technical details)
- API Docs → Blog (for concept understanding)

### Problem → Solution → Tool Flow

1. **Blog identifies** "Why gamification fails"
2. **Homepage presents** "GameLayer solutions"
3. **API docs provide** "GameLayer API tools"

**Linking Pattern:**
- Blog → Homepage (for solutions)
- Homepage → API Docs (for tools)
- API Docs → Blog (for problem context)

---

## Contextual Linking Examples

### Example 1: Homepage Features Section

**Content:** "GameLayer supports missions, achievements, streaks, and leaderboards."

**Potential Links:**
- "missions" → Blog post about missions
- "achievements" → Blog post about achievements
- "streaks" → Blog post about streaks
- "leaderboards" → Blog post about leaderboards
- "See all features" → `/#features`
- "API documentation" → `/api-docs` (for developers)

### Example 2: Blog Post About User Engagement

**Content:** "Gamification is a powerful tool for increasing user engagement."

**Potential Links:**
- "Gamification" → Homepage (platform overview)
- "user engagement" → Blog post about engagement strategies
- "GameLayer" → Homepage
- "See how GameLayer helps" → `/#solutions`
- "API implementation" → `/api-docs`

### Example 3: API Docs Endpoint Documentation

**Content:** "The missions endpoint allows you to create and manage missions."

**Potential Links:**
- "missions" → Blog post about missions
- "GameLayer platform" → Homepage
- "See all endpoints" → `/api-docs` (endpoint index)
- "Best practices" → Blog post about API best practices

---

## Notes

- This is a **conceptual plan only**
- No actual link insertions are recommended
- Linking should be natural and contextual
- Avoid over-optimization or keyword stuffing in anchor text
- Links should provide value to users, not just search engines
- Monitor link performance and adjust based on user behavior
- Internal linking should complement, not replace, navigation
- Consider user intent when deciding link placement
- Balance SEO benefits with user experience

---

## Implementation Considerations

### When to Add Links
- When content naturally references related topics
- When users would benefit from additional context
- When linking supports user journey
- When linking provides value

### When Not to Add Links
- When links feel forced or unnatural
- When links interrupt content flow
- When links don't provide value
- When over-linking would harm user experience

### Link Placement
- Within content (contextual)
- At end of sections (related content)
- In sidebars (navigation)
- In footers (site-wide navigation)

### Link Monitoring
- Track click-through rates
- Monitor user behavior
- Adjust based on performance
- Remove underperforming links
- Add links where gaps exist
