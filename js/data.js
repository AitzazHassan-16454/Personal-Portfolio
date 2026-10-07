/* =============================================================================
   Team data — drives the filter tabs and member cards.
   Swap `photo` for your own headshots (square-ish portrait, ~1024px tall works
   best). A single URL is fine: the grayscale idle layer is a CSS filter.
   ============================================================================= */

window.TEAM_DATA = [
    {
        id: 'engineering',
        label: 'Engineering',
        icon: '<path d="M8 4l-5 8 5 8M16 4l5 8-5 8M14 2l-4 20" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
        members: [
            {
                name: 'Ishan Gupta',
                role: 'AI/ML Architect',
                experience: '9+ Years experience',
                stack: 'AWS SageMaker, LangChain, OpenAI API',
                tags: ['Python', 'RAG', 'LLMOps'],
                photo: 'images/team/img-12.webp'
            },
            {
                name: 'Clara Hoffmann',
                role: 'Staff Frontend Engineer',
                experience: '11+ Years experience',
                stack: 'TypeScript, React, WebGL',
                tags: ['Design Systems', 'Perf', 'a11y'],
                photo: 'images/team/img-47.webp'
            },
            {
                name: 'Rohan Pillai',
                role: 'Platform Engineer',
                experience: '7+ Years experience',
                stack: 'Kubernetes, Terraform, Envoy',
                tags: ['Go', 'Docker', 'CI/CD'],
                photo: 'images/team/img-68.webp'
            },
            {
                name: 'Yuki Tanaka',
                role: 'Backend Engineer',
                experience: '6+ Years experience',
                stack: 'Go, Postgres, gRPC',
                tags: ['Go', 'Postgres', 'Kafka'],
                photo: 'images/team/img-45.webp'
            },
            {
                name: 'Amara Okafor',
                role: 'Principal Engineer',
                experience: '13+ Years experience',
                stack: 'Distributed systems, Rust, C++',
                tags: ['Rust', 'Systems', 'Review'],
                photo: 'images/team/img-44.webp'
            }
        ]
    },
    {
        id: 'design',
        label: 'Design',
        icon: '<path d="M12 2a10 10 0 100 20c1.4 0 2-.9 2-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.7-1.6 1.6-1.6H16a6 6 0 006-6c0-4.6-4.5-8.2-10-8.2zM7.5 11a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm4-3a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm4.5 3a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" fill="currentColor"/>',
        members: [
            {
                name: 'Sofia Marchetti',
                role: 'Design Systems Lead',
                experience: '8+ Years experience',
                stack: 'Figma, Tokens, Storybook',
                tags: ['Systems', 'Tokens', 'Docs'],
                photo: 'images/team/img-32.webp'
            },
            {
                name: 'Daniel Ek',
                role: 'Principal Product Designer',
                experience: '10+ Years experience',
                stack: 'Research, Prototyping, IA',
                tags: ['UX', 'Research', 'Mobile'],
                photo: 'images/team/img-11.webp'
            },
            {
                name: 'Nadia Haddad',
                role: 'Brand & Motion',
                experience: '6+ Years experience',
                stack: 'After Effects, Lottie, SVG',
                tags: ['Motion', 'Brand', '3D'],
                photo: 'images/team/img-49.webp'
            },
            {
                name: 'Oliver Brandt',
                role: 'Accessibility Specialist',
                experience: '9+ Years experience',
                stack: 'WCAG 2.2, ARIA, Audit',
                tags: ['a11y', 'Audit', 'Training'],
                photo: 'images/team/img-13.webp'
            }
        ]
    },
    {
        id: 'product',
        label: 'Product',
        icon: '<rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M3 9h18M8 14h8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
        members: [
            {
                name: 'Priya Raghavan',
                role: 'Head of Product',
                experience: '12+ Years experience',
                stack: 'Discovery, Pricing, Strategy',
                tags: ['Strategy', 'Pricing', 'GTM'],
                photo: 'images/team/img-10.webp'
            },
            {
                name: 'Tomas Lindqvist',
                role: 'Technical Product Manager',
                experience: '8+ Years experience',
                stack: 'APIs, Analytics, Roadmaps',
                tags: ['APIs', 'Analytics', 'Planning'],
                photo: 'images/team/img-15.webp'
            },
            {
                name: 'Grace Mutiso',
                role: 'Product Analyst',
                experience: '5+ Years experience',
                stack: 'SQL, dbt, Looker',
                tags: ['SQL', 'dbt', 'Metrics'],
                photo: 'images/team/img-26.webp'
            }
        ]
    },
    {
        id: 'data',
        label: 'Data & AI',
        icon: '<ellipse cx="12" cy="6" rx="8" ry="3" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" stroke="currentColor" stroke-width="1.6" fill="none"/>',
        members: [
            {
                name: 'Hana Kim',
                role: 'Data Platform Lead',
                experience: '9+ Years experience',
                stack: 'Snowflake, Airflow, dbt',
                tags: ['Snowflake', 'dbt', 'ELT'],
                photo: 'images/team/img-5.webp'
            },
            {
                name: 'Marcus Bell',
                role: 'ML Engineer',
                experience: '7+ Years experience',
                stack: 'PyTorch, MLflow, Triton',
                tags: ['PyTorch', 'Serving', 'MLOps'],
                photo: 'images/team/img-53.webp'
            },
            {
                name: 'Lucia Ferreira',
                role: 'Analytics Engineer',
                experience: '6+ Years experience',
                stack: 'BigQuery, Looker, Python',
                tags: ['BigQuery', 'Looker', 'Python'],
                photo: 'images/team/img-25.webp'
            },
            {
                name: 'Sam Whitfield',
                role: 'Security Engineer',
                experience: '10+ Years experience',
                stack: 'AppSec, IAM, SOC 2',
                tags: ['AppSec', 'IAM', 'SOC 2'],
                photo: 'images/team/img-58.webp'
            }
        ]
    }
];