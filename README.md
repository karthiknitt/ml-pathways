# ML Pathways v1.0

An interactive web-based platform for learning and experimenting with foundational machine learning algorithms. Inspired by Andrew Ng's Machine Learning course, ML Pathways provides a hands-on environment where users can explore ML problems, interact with an AI agent, generate code, and execute experiments safely.

## Features

### Core Functionality

- **9 ML Problem Types**: Linear regression, logistic regression, neural networks, clustering, and more
- **Interactive AI Assistant**: Chat with GPT-4, Claude, or Gemini for guidance, EDA, and Q&A
- **Automated Code Generation**: Generate production-ready Python code for ML tasks
- **Sandboxed Execution**: Safe code execution using E2B Code Interpreter
- **Sample Datasets**: Curated datasets for each problem type
- **Custom Dataset Upload**: Bring your own CSV files
- **Automated EDA**: Instant exploratory data analysis with statistics and insights
- **Interactive Visualizations**: Charts and graphs using Plotly.js and Recharts
- **Experiment Tracking**: Save and manage your ML experiments

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TypeScript |
| UI Components | Shadcn UI, Tailwind CSS |
| Backend | Next.js API Routes |
| Database | Neon Serverless Postgres |
| ORM | Drizzle ORM |
| Authentication | BetterAuth (ready to configure) |
| AI Providers | OpenAI GPT-4, Anthropic Claude, Google Gemini |
| Code Execution | E2B Code Interpreter |
| File Storage | Cloudflare R2 (ready to configure) |
| Charts | Plotly.js, Recharts |
| Monitoring | Sentry (ready to configure) |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Neon recommended)
- At least one AI provider API key (OpenAI, Anthropic, or Google)
- E2B API key for code execution (optional but recommended)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/ml-pathways.git
cd ml-pathways
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:

```env
# Database
DATABASE_URL=your_neon_postgres_connection_string

# AI Provider (choose one or more)
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_API_KEY=your_google_key

# Set your preferred provider (default: claude)
AI_PROVIDER=claude  # or openai, gemini

# Code Execution (optional)
E2B_API_KEY=your_e2b_key

# Authentication (optional)
BETTER_AUTH_SECRET=your_secret_key
BETTER_AUTH_URL=http://localhost:3000

# File Storage (optional)
CLOUDFLARE_R2_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET_NAME=

# Monitoring (optional)
SENTRY_DSN=
```

4. **Set up the database**

Run database migrations:

```bash
npm run db:push
```

5. **Start the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
ml-pathways/
├── src/
│   ├── app/                      # Next.js app directory
│   │   ├── api/                  # API routes
│   │   │   ├── chat/            # AI chat endpoint
│   │   │   ├── generate-code/   # Code generation endpoint
│   │   │   └── execute/         # Code execution endpoint
│   │   ├── dashboard/           # User dashboard
│   │   ├── problems/            # ML problems listing
│   │   ├── datasets/            # Dataset management
│   │   ├── experiments/         # Experiment tracking
│   │   └── workspace/           # Experiment workspace
│   ├── components/              # React components
│   │   ├── ui/                  # Shadcn UI components
│   │   └── layout/              # Layout components
│   ├── lib/
│   │   ├── ai/                  # AI provider integrations
│   │   ├── eda/                 # Data analysis utilities
│   │   ├── constants/           # ML problem definitions
│   │   └── sample-data/         # Sample datasets
│   └── db/
│       ├── schema.ts            # Database schema
│       └── index.ts             # Database client
├── drizzle/                     # Database migrations
├── public/                      # Static assets
└── package.json
```

## Supported ML Problems

### Beginner Level
1. **Linear Regression (Single Variable)** - Predict housing prices by size
2. **Linear Regression (Multiple Variables)** - Multi-feature price prediction
3. **Logistic Regression** - Binary classification for university admissions

### Intermediate Level
4. **Regularized Regression** - Prevent overfitting with L1/L2 regularization
5. **Polynomial Regression** - Model nonlinear relationships
6. **Multi-class Classification** - Handwritten digit recognition
7. **K-Means Clustering** - Customer segmentation

### Advanced Level
8. **Neural Networks** - Deep learning for image classification
9. **Principal Component Analysis (PCA)** - Dimensionality reduction

## User Workflow

1. **Choose an ML Problem** - Browse problems by difficulty or category
2. **Select a Dataset** - Use sample data or upload your own CSV
3. **Explore with AI** - Chat with the AI assistant about your data
4. **Automated EDA** - Get instant insights and visualizations
5. **Generate Code** - AI creates Python code for your experiment
6. **Execute Safely** - Run code in a sandboxed environment
7. **Visualize Results** - Interactive charts and performance metrics
8. **Iterate & Learn** - Refine your approach with AI guidance

## API Routes

### POST /api/chat
Chat with the AI assistant.

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Explain linear regression" }
  ],
  "problemType": "linear_regression_single",
  "context": "Optional additional context"
}
```

**Response:**
```json
{
  "message": "AI response...",
  "provider": "claude"
}
```

### POST /api/generate-code
Generate Python code for an ML task.

**Request:**
```json
{
  "problemType": "linear_regression_single",
  "task": "Train a linear regression model on housing data",
  "datasetInfo": {
    "columns": ["size", "price"],
    "rowCount": 100
  }
}
```

**Response:**
```json
{
  "code": "import pandas as pd...",
  "explanation": "Code explanation",
  "provider": "claude"
}
```

### POST /api/execute
Execute Python code in a sandbox.

**Request:**
```json
{
  "code": "print('Hello, ML!')",
  "datasetUrl": "https://example.com/data.csv"
}
```

**Response:**
```json
{
  "status": "success",
  "output": "Hello, ML!",
  "charts": [],
  "logs": []
}
```

## Database Schema

Key tables:
- `users` - User accounts
- `datasets` - Uploaded and sample datasets
- `experiments` - ML experiments
- `executions` - Code execution records
- `chat_messages` - Conversation history
- `eda_results` - Exploratory data analysis results
- `sample_datasets` - Pre-loaded sample datasets

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate migrations
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio
```

### Adding a New ML Problem

1. Add the problem type to the enum in `src/db/schema.ts`
2. Define the problem in `src/lib/constants/ml-problems.ts`
3. Create a sample dataset in `src/lib/sample-data/`
4. Add problem-specific context in `src/lib/ai/prompts.ts`

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Database Setup (Neon)

1. Create a Neon account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Add to `DATABASE_URL` in your environment variables
5. Run `npm run db:push` to create tables

### E2B Setup

1. Create an account at [e2b.dev](https://e2b.dev)
2. Get your API key
3. Add to `E2B_API_KEY` in environment variables

## Security Features

- Sandboxed code execution prevents malicious code
- API rate limiting (ready to configure)
- Input validation on all endpoints
- Secure file upload handling
- Environment variable protection

## Future Enhancements

- [ ] Additional ML algorithms (SVM, Decision Trees, Random Forests)
- [ ] Real-time collaboration features
- [ ] Community dataset sharing
- [ ] Experiment leaderboards
- [ ] Advanced visualization options
- [ ] Jupyter notebook export
- [ ] Model deployment capabilities
- [ ] Mobile app version

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Inspired by Andrew Ng's Machine Learning course
- Built with Next.js, Shadcn UI, and modern ML tools
- Powered by OpenAI, Anthropic, and Google AI

## Support

For issues and feature requests, please use the GitHub issue tracker.

---

**ML Pathways** - Learn machine learning by doing, guided by AI.
