// FinBoost Education System - Complete Content Database
// 25+ Tutorials and Quizzes across all categories

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  title: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  points: number;
  estimatedTime: string;
  completed: boolean;
  content: string;
  quiz: QuizQuestion[];
}

export const educationContent: { [key: string]: Lesson } = {
  // BUDGETING CATEGORY
  'budgeting-basics': {
    id: 'budgeting-basics',
    title: 'Budgeting Basics',
    category: 'Budgeting',
    difficulty: 'Beginner',
    points: 20,
    estimatedTime: '15 min',
    completed: false,
    content: `
      <h2>Master Your Money with Budgeting Basics</h2>

      <p>Creating your first budget is the foundation of financial success. Learn how to track your income and expenses to take control of your money.</p>

      <h3>Why Budget?</h3>
      <ul>
        <li>Know where your money goes</li>
        <li>Avoid overspending</li>
        <li>Save for your goals</li>
        <li>Reduce financial stress</li>
      </ul>

      <h3>The 50/30/20 Rule</h3>
      <p><strong>50% - Needs:</strong> Essential expenses like rent, utilities, groceries</p>
      <p><strong>30% - Wants:</strong> Entertainment, dining out, hobbies</p>
      <p><strong>20% - Savings:</strong> Emergency fund, retirement, debt payments</p>

      <h3>Getting Started</h3>
      <p>1. Track your income for one month</p>
      <p>2. List all your expenses</p>
      <p>3. Categorize needs vs wants</p>
      <p>4. Adjust spending to fit the 50/30/20 rule</p>
    `,
    quiz: [
      {
        id: 1,
        question: "What percentage of your income should go to needs according to the 50/30/20 rule?",
        options: ["30%", "50%", "20%", "40%"],
        correctAnswer: 1,
        explanation: "According to the 50/30/20 rule, 50% should go to essential needs like housing, utilities, and groceries."
      },
      {
        id: 2,
        question: "Which of these is considered a 'want' rather than a 'need'?",
        options: ["Rent payment", "Grocery bills", "Streaming subscriptions", "Insurance premiums"],
        correctAnswer: 2,
        explanation: "Streaming subscriptions are entertainment expenses and fall under the 'wants' category."
      }
    ]
  },

  'emergency-fund': {
    id: 'emergency-fund',
    title: 'Emergency Fund',
    category: 'Savings',
    difficulty: 'Beginner',
    points: 20,
    estimatedTime: '12 min',
    completed: false,
    content: `
      <h2>Build Your Financial Safety Net</h2>

      <p>An emergency fund is money set aside specifically for unexpected expenses or financial emergencies.</p>

      <h3>Why You Need an Emergency Fund</h3>
      <ul>
        <li>Avoid going into debt for unexpected expenses</li>
        <li>Reduce financial stress and anxiety</li>
        <li>Maintain financial stability during job loss</li>
        <li>Handle medical emergencies without borrowing</li>
      </ul>

      <h3>How Much to Save</h3>
      <p><strong>Starter Goal:</strong> $1,000 for small emergencies</p>
      <p><strong>Full Goal:</strong> 3-6 months of living expenses</p>

      <h3>Where to Keep Your Emergency Fund</h3>
      <ul>
        <li>High-yield savings account</li>
        <li>Money market account</li>
        <li>Short-term CDs</li>
      </ul>

      <p>Keep it separate from your checking account but easily accessible!</p>
    `,
    quiz: [
      {
        id: 1,
        question: "What is the recommended starter emergency fund amount?",
        options: ["$500", "$1,000", "$5,000", "$10,000"],
        correctAnswer: 1,
        explanation: "A starter emergency fund of $1,000 covers most small unexpected expenses and prevents you from going into debt."
      },
      {
        id: 2,
        question: "How many months of expenses should a full emergency fund cover?",
        options: ["1-2 months", "3-6 months", "12 months", "24 months"],
        correctAnswer: 1,
        explanation: "A full emergency fund should cover 3-6 months of living expenses to handle major financial emergencies."
      }
    ]
  },

  'investment-basics': {
    id: 'investment-basics',
    title: 'Investment Basics',
    category: 'Investing',
    difficulty: 'Intermediate',
    points: 20,
    estimatedTime: '20 min',
    completed: false,
    content: `
      <h2>Start Your Investment Journey</h2>

      <p>Investing helps your money grow over time through the power of compound interest.</p>

      <h3>Types of Investments</h3>
      <p><strong>Stocks:</strong> Ownership shares in companies</p>
      <p><strong>Bonds:</strong> Loans to companies or governments</p>
      <p><strong>Mutual Funds:</strong> Diversified investment pools</p>
      <p><strong>ETFs:</strong> Exchange-traded funds with low fees</p>

      <h3>Investment Principles</h3>
      <ul>
        <li>Start early - time is your biggest advantage</li>
        <li>Diversify - don't put all eggs in one basket</li>
        <li>Invest regularly - dollar-cost averaging</li>
        <li>Keep fees low - they compound negatively</li>
        <li>Stay consistent - don't panic sell</li>
      </ul>

      <h3>Getting Started</h3>
      <p>1. Pay off high-interest debt first</p>
      <p>2. Build your emergency fund</p>
      <p>3. Start with low-cost index funds</p>
      <p>4. Increase contributions over time</p>
    `,
    quiz: [
      {
        id: 1,
        question: "What is the most important factor for investment success?",
        options: ["Picking individual stocks", "Timing the market", "Starting early", "Following tips"],
        correctAnswer: 2,
        explanation: "Starting early gives you the most time for compound growth, which is the most powerful factor in building wealth."
      },
      {
        id: 2,
        question: "What should you do before investing?",
        options: ["Buy individual stocks", "Pay off high-interest debt", "Wait for market crashes", "Invest everything at once"],
        correctAnswer: 1,
        explanation: "Pay off high-interest debt first, as the guaranteed 'return' of eliminating debt often exceeds potential investment returns."
      }
    ]
  },

  'credit-management': {
    id: 'credit-management',
    title: 'Credit Management',
    category: 'Credit',
    difficulty: 'Beginner',
    points: 20,
    estimatedTime: '18 min',
    completed: false,
    content: `
      <h2>Master Your Credit Score</h2>

      <p>Your credit score affects your ability to borrow money and the interest rates you'll pay.</p>

      <h3>What Affects Your Credit Score</h3>
      <p><strong>Payment History (35%):</strong> Pay all bills on time</p>
      <p><strong>Credit Utilization (30%):</strong> Keep balances low</p>
      <p><strong>Length of Credit History (15%):</strong> Keep old accounts open</p>
      <p><strong>Credit Mix (10%):</strong> Different types of credit</p>
      <p><strong>New Credit (10%):</strong> Limit new applications</p>

      <h3>Credit Score Ranges</h3>
      <ul>
        <li>800-850: Excellent</li>
        <li>740-799: Very Good</li>
        <li>670-739: Good</li>
        <li>580-669: Fair</li>
        <li>300-579: Poor</li>
      </ul>

      <h3>Improving Your Credit</h3>
      <p>1. Pay all bills on time, every time</p>
      <p>2. Keep credit utilization below 30%</p>
      <p>3. Don't close old credit cards</p>
      <p>4. Check your credit report regularly</p>
      <p>5. Dispute any errors you find</p>
    `,
    quiz: [
      {
        id: 1,
        question: "What has the biggest impact on your credit score?",
        options: ["Credit utilization", "Payment history", "Length of credit history", "Credit mix"],
        correctAnswer: 1,
        explanation: "Payment history makes up 35% of your credit score and is the most important factor."
      },
      {
        id: 2,
        question: "What credit utilization ratio should you aim for?",
        options: ["Below 10%", "Below 30%", "Below 50%", "Below 70%"],
        correctAnswer: 1,
        explanation: "Keep your credit utilization below 30% for a good score, but below 10% is even better."
      }
    ]
  },

  'retirement-planning': {
    id: 'retirement-planning',
    title: 'Retirement Planning',
    category: 'Planning',
    difficulty: 'Intermediate',
    points: 20,
    estimatedTime: '25 min',
    completed: false,
    content: `
      <h2>Plan for Your Future</h2>

      <p>Retirement planning ensures you can maintain your lifestyle when you stop working.</p>

      <h3>Retirement Account Types</h3>
      <p><strong>401(k):</strong> Employer-sponsored, often with matching</p>
      <p><strong>Traditional IRA:</strong> Tax-deductible contributions, taxed in retirement</p>
      <p><strong>Roth IRA:</strong> After-tax contributions, tax-free in retirement</p>
      <p><strong>SEP-IRA:</strong> For self-employed individuals</p>

      <h3>The Power of Employer Matching</h3>
      <p>If your employer offers 401(k) matching, contribute enough to get the full match - it's free money!</p>

      <h3>How Much to Save</h3>
      <ul>
        <li>Start with at least 10% of income</li>
        <li>Increase by 1% each year</li>
        <li>Aim for 15-20% total retirement savings</li>
        <li>Use catch-up contributions if over 50</li>
      </ul>

      <h3>Investment Strategy</h3>
      <p>1. Start aggressive when young (more stocks)</p>
      <p>2. Gradually shift to conservative (more bonds)</p>
      <p>3. Use target-date funds for simplicity</p>
      <p>4. Rebalance annually</p>
    `,
    quiz: [
      {
        id: 1,
        question: "What should be your first priority in retirement planning?",
        options: ["Maxing out IRA contributions", "Getting full employer 401(k) match", "Buying individual stocks", "Opening a Roth IRA"],
        correctAnswer: 1,
        explanation: "Getting the full employer match is free money and should be your first priority."
      },
      {
        id: 2,
        question: "What percentage of income should you aim to save for retirement?",
        options: ["5%", "10%", "15-20%", "30%"],
        correctAnswer: 2,
        explanation: "Financial experts recommend saving 15-20% of your income for retirement to maintain your lifestyle."
      }
    ]
  },

  'tax-optimization': {
    id: 'tax-optimization',
    title: 'Tax Optimization',
    category: 'Taxes',
    difficulty: 'Intermediate',
    points: 20,
    estimatedTime: '22 min',
    completed: false,
    content: `
      <h2>Maximize Your Tax Savings</h2>

      <p>Understanding taxes helps you keep more of your hard-earned money.</p>

      <h3>Tax-Advantaged Accounts</h3>
      <p><strong>401(k) and Traditional IRA:</strong> Reduce current year taxes</p>
      <p><strong>Roth IRA and Roth 401(k):</strong> Tax-free growth and withdrawals</p>
      <p><strong>HSA:</strong> Triple tax advantage for medical expenses</p>
      <p><strong>529 Plans:</strong> Tax-free growth for education expenses</p>

      <h3>Common Tax Deductions</h3>
      <ul>
        <li>Mortgage interest</li>
        <li>State and local taxes</li>
        <li>Charitable contributions</li>
        <li>Medical expenses (over 7.5% of AGI)</li>
        <li>Student loan interest</li>
      </ul>

      <h3>Tax Credits vs Deductions</h3>
      <p><strong>Tax Credits:</strong> Dollar-for-dollar reduction in taxes owed</p>
      <p><strong>Tax Deductions:</strong> Reduce your taxable income</p>

      <h3>Tax Planning Strategies</h3>
      <p>1. Contribute to tax-advantaged accounts</p>
      <p>2. Consider Roth conversions in low-income years</p>
      <p>3. Harvest tax losses in investment accounts</p>
      <p>4. Time charitable giving strategically</p>
      <p>5. Keep detailed records</p>
    `,
    quiz: [
      {
        id: 1,
        question: "Which account offers a triple tax advantage?",
        options: ["Traditional IRA", "Roth IRA", "401(k)", "HSA"],
        correctAnswer: 3,
        explanation: "HSAs offer tax-deductible contributions, tax-free growth, and tax-free withdrawals for qualified medical expenses."
      },
      {
        id: 2,
        question: "What's the difference between a tax credit and tax deduction?",
        options: ["They're the same thing", "Credits reduce taxable income, deductions reduce taxes owed", "Credits reduce taxes owed, deductions reduce taxable income", "Credits are only for businesses"],
        correctAnswer: 2,
        explanation: "Tax credits provide a dollar-for-dollar reduction in taxes owed, while deductions reduce your taxable income."
      }
    ]
  },

  'budgeting-101': {
    id: 'budgeting-101',
    title: 'Your First Budget: The 50/30/20 Rule Explained',
    category: 'Budgeting',
    difficulty: 'Beginner',
    points: 20,
    estimatedTime: '8 minutes',
    completed: false,
    content: `
      <h2>Master Your Money with the 50/30/20 Rule</h2>

      <p>Creating your first budget doesn't have to be overwhelming. The 50/30/20 rule is a simple, proven framework that helps millions of people take control of their finances.</p>

      <div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; margin: 1rem 0; border-left: 4px solid #3b82f6;">
        <strong>💡 Pro Tip:</strong> This rule works for any income level - whether you make $30,000 or $300,000 per year!
      </div>

      <h3>How the 50/30/20 Rule Works</h3>

      <p><strong>50% - Needs (Essential Expenses)</strong></p>
      <ul>
        <li>Rent or mortgage payments</li>
        <li>Utilities (electricity, water, internet)</li>
        <li>Groceries and basic food</li>
        <li>Transportation (car payment, gas, public transit)</li>
        <li>Insurance premiums</li>
        <li>Minimum debt payments</li>
      </ul>

      <p><strong>30% - Wants (Lifestyle Expenses)</strong></p>
      <ul>
        <li>Dining out and entertainment</li>
        <li>Streaming services and subscriptions</li>
        <li>Hobbies and recreation</li>
        <li>Shopping for non-essentials</li>
        <li>Gym memberships</li>
      </ul>

      <p><strong>20% - Savings and Debt Repayment</strong></p>
      <ul>
        <li>Emergency fund contributions</li>
        <li>Retirement savings (401k, IRA)</li>
        <li>Extra debt payments beyond minimums</li>
        <li>Short-term savings goals</li>
      </ul>

      <h3>Step-by-Step Implementation</h3>

      <p><strong>Step 1: Calculate Your After-Tax Income</strong><br>
      Use your monthly take-home pay after taxes and deductions. If your income varies, use an average of the last 3 months.</p>

      <p><strong>Step 2: Track Your Current Spending</strong><br>
      For one week, write down every expense. Use your bank statements to categorize where your money currently goes.</p>

      <p><strong>Step 3: Apply the Percentages</strong><br>
      If you take home $4,000/month:
      • Needs: $2,000 (50%)
      • Wants: $1,200 (30%)
      • Savings: $800 (20%)</p>

      <div style="background: #fef2f2; padding: 1rem; border-radius: 8px; margin: 1rem 0; border-left: 4px solid #ef4444;">
        <strong>⚠️ Reality Check:</strong> If your needs exceed 50%, focus on reducing housing costs or finding additional income before cutting wants entirely.
      </div>

      <h3>Making Adjustments</h3>

      <p>The 50/30/20 rule is a starting point, not a rigid law. Adjust based on your situation:</p>

      <ul>
        <li><strong>High debt:</strong> Consider 50/20/30 to accelerate debt payoff</li>
        <li><strong>Low income:</strong> Start with 60/20/20 and work toward the ideal</li>
        <li><strong>High earner:</strong> Try 45/25/30 to maximize savings</li>
      </ul>

      <p>Remember: The best budget is one you'll actually follow. Start simple and refine as you go!</p>
    `,
    quiz: [
      {
        id: 1,
        question: "According to the 50/30/20 rule, what percentage should go toward 'needs'?",
        options: ["40%", "50%", "60%", "30%"],
        correctAnswer: 1,
        explanation: "The 50/30/20 rule allocates 50% of after-tax income to essential needs like housing, utilities, and minimum debt payments."
      },
      {
        id: 2,
        question: "Which expense belongs in the 'wants' category?",
        options: ["Rent payment", "Grocery shopping", "Netflix subscription", "Car insurance"],
        correctAnswer: 2,
        explanation: "Netflix is entertainment, which falls under the 'wants' category. The other options are essential needs."
      },
      {
        id: 3,
        question: "If you take home $3,000 per month, how much should you save according to this rule?",
        options: ["$400", "$500", "$600", "$700"],
        correctAnswer: 2,
        explanation: "20% of $3,000 = $600. This amount should go toward savings and extra debt payments beyond minimums."
      },
      {
        id: 4,
        question: "What should you do if your needs exceed 50% of your income?",
        options: ["Eliminate all wants", "Focus on reducing housing costs", "Ignore the rule completely", "Increase wants spending"],
        correctAnswer: 1,
        explanation: "If needs exceed 50%, the priority should be reducing major expenses like housing or finding additional income, rather than eliminating all discretionary spending."
      }
    ]
  },

  'zero-based-budgeting': {
    id: 'zero-based-budgeting',
    title: 'Zero-Based Budgeting: Give Every Dollar a Job',
    category: 'Budgeting',
    difficulty: 'Intermediate',
    points: 20,
    estimatedTime: '12 minutes',
    completed: false,
    content: `
      <h2>Zero-Based Budgeting: Maximum Control Over Your Money</h2>

      <p>Zero-based budgeting is a powerful method where you assign every dollar of income to a specific category before you spend it. The goal is simple: Income minus expenses equals zero.</p>

      <div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; margin: 1rem 0; border-left: 4px solid #3b82f6;">
        <strong>💡 Key Concept:</strong> "Zero-based" doesn't mean you have zero dollars left - it means every dollar has been intentionally allocated!
      </div>

      <h3>How Zero-Based Budgeting Works</h3>

      <p>Unlike percentage-based budgets, zero-based budgeting requires you to justify every expense from scratch each month. Here's the process:</p>

      <p><strong>1. Start with Your Income</strong><br>
      Use your total monthly take-home pay as your starting number.</p>

      <p><strong>2. List All Fixed Expenses</strong><br>
      These are the same every month:
      • Rent/mortgage
      • Car payments
      • Insurance premiums
      • Minimum debt payments
      • Subscription services</p>

      <p><strong>3. Estimate Variable Expenses</strong><br>
      These change monthly but are necessary:
      • Groceries
      • Utilities
      • Gas
      • Phone bill</p>

      <p><strong>4. Assign Remaining Funds</strong><br>
      Every leftover dollar gets a specific job:
      • Emergency fund
      • Debt payoff
      • Savings goals
      • Entertainment
      • Dining out</p>

      <h3>Example: $4,500 Monthly Income</h3>

      <div style="background: #f8fafc; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
        <p><strong>Fixed Expenses: $2,800</strong></p>
        <ul>
          <li>Rent: $1,400</li>
          <li>Car payment: $350</li>
          <li>Insurance: $200</li>
          <li>Student loan minimum: $250</li>
          <li>Phone: $80</li>
          <li>Gym: $30</li>
          <li>Streaming: $40</li>
        </ul>

        <p><strong>Variable Expenses: $800</strong></p>
        <ul>
          <li>Groceries: $400</li>
          <li>Utilities: $150</li>
          <li>Gas: $120</li>
          <li>Personal care: $80</li>
          <li>Miscellaneous: $50</li>
        </ul>

        <p><strong>Remaining: $900</strong></p>
        <ul>
          <li>Emergency fund: $300</li>
          <li>Extra student loan payment: $200</li>
          <li>Vacation savings: $150</li>
          <li>Dining out: $150</li>
          <li>Entertainment: $100</li>
        </ul>

        <p><strong>Total Allocated: $4,500 ✓</strong></p>
      </div>

      <h3>Benefits of Zero-Based Budgeting</h3>

      <ul>
        <li><strong>Intentional spending:</strong> Every purchase aligns with your priorities</li>
        <li><strong>Prevents lifestyle inflation:</strong> No "leftover" money to spend carelessly</li>
        <li><strong>Accelerates goals:</strong> Surplus automatically goes toward objectives</li>
        <li><strong>Increases awareness:</strong> You know exactly where every dollar goes</li>
      </ul>

      <div style="background: #fef2f2; padding: 1rem; border-radius: 8px; margin: 1rem 0; border-left: 4px solid #ef4444;">
        <strong>⚠️ Common Mistake:</strong> Don't forget to budget for irregular expenses like car maintenance, gifts, and annual fees!
      </div>

      <h3>Monthly Review Process</h3>

      <p>Zero-based budgeting requires monthly attention:</p>

      <ol>
        <li><strong>Track actual spending</strong> against your budget</li>
        <li><strong>Identify variances</strong> and understand why they occurred</li>
        <li><strong>Adjust next month's allocations</strong> based on what you learned</li>
        <li><strong>Reallocate unused funds</strong> to high-priority goals</li>
      </ol>

      <p>This method works best for people who want maximum control over their finances and are willing to spend time planning each month.</p>
    `,
    quiz: [
      {
        id: 1,
        question: "In zero-based budgeting, what does 'zero' refer to?",
        options: ["Having zero dollars in savings", "Income minus all allocated expenses", "Zero debt remaining", "Zero entertainment spending"],
        correctAnswer: 1,
        explanation: "Zero-based budgeting means Income minus all allocated expenses equals zero - every dollar has been assigned a specific purpose."
      },
      {
        id: 2,
        question: "Which expense should be allocated first in zero-based budgeting?",
        options: ["Entertainment", "Fixed expenses", "Savings goals", "Emergency fund"],
        correctAnswer: 1,
        explanation: "Fixed expenses (rent, loan payments, insurance) should be allocated first since they're required and don't change month to month."
      },
      {
        id: 3,
        question: "What's the main advantage of zero-based budgeting over percentage-based budgeting?",
        options: ["It's easier to follow", "It requires less time", "Every dollar is intentionally allocated", "It allows more flexibility"],
        correctAnswer: 2,
        explanation: "Zero-based budgeting ensures every dollar has a specific job, preventing mindless spending of 'leftover' money."
      }
    ]
  },

  // CREDIT CATEGORY
  'credit-basics': {
    id: 'credit-basics',
    title: 'Building Credit from Zero: Step-by-Step Guide',
    category: 'Credit',
    difficulty: 'Beginner',
    points: 20,
    estimatedTime: '10 minutes',
    completed: false,
    content: `
      <h2>Building Credit from Zero: Your Complete Roadmap</h2>

      <p>Building credit from scratch might seem daunting, but with the right strategy, you can establish a solid credit foundation in 6-12 months. Here's your complete roadmap.</p>

      <div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; margin: 1rem 0; border-left: 4px solid #3b82f6;">
        <strong>💡 Did You Know:</strong> 1 in 5 Americans have no credit history at all - you're not alone in starting from zero!
      </div>

      <h3>Understanding Credit Basics</h3>

      <p>Your credit score is a three-digit number (300-850) that represents your creditworthiness. It's calculated based on five factors:</p>

      <ul>
        <li><strong>Payment History (35%)</strong> - Do you pay on time?</li>
        <li><strong>Credit Utilization (30%)</strong> - How much credit are you using?</li>
        <li><strong>Length of Credit History (15%)</strong> - How long have you had credit?</li>
        <li><strong>Credit Mix (10%)</strong> - Variety of credit types</li>
        <li><strong>New Credit (10%)</strong> - Recent credit applications</li>
      </ul>

      <h3>Step 1: Get Your First Credit Card</h3>

      <p>With no credit history, you'll likely need to start with one of these options:</p>

      <p><strong>Secured Credit Cards</strong> (Recommended for beginners)</p>
      <ul>
        <li>Requires a cash deposit (usually $200-500)</li>
        <li>Deposit becomes your credit limit</li>
        <li>Reports to all three credit bureaus</li>
        <li>Can graduate to unsecured after 6-12 months</li>
      </ul>

      <p><strong>Student Credit Cards</strong></p>
      <ul>
        <li>Designed for college students</li>
        <li>Lower approval requirements</li>
        <li>Often include educational resources</li>
      </ul>

      <p><strong>Authorized User Status</strong></p>
      <ul>
        <li>Ask family member to add you to their card</li>
        <li>Their payment history affects your credit</li>
        <li>Choose someone with excellent credit habits</li>
      </ul>

      <h3>Step 2: Use Your Credit Responsibly</h3>

      <div style="background: #fef2f2; padding: 1rem; border-radius: 8px; margin: 1rem 0; border-left: 4px solid #ef4444;">
        <strong>⚠️ Golden Rules:</strong> Keep utilization under 30% (ideally under 10%) and NEVER miss a payment!
      </div>

      <p><strong>Smart Usage Strategies:</strong></p>
      <ul>
        <li>Use the card for small, regular purchases (gas, groceries)</li>
        <li>Pay the full balance every month</li>
        <li>Set up automatic payments to avoid missed payments</li>
        <li>Keep the card active with occasional small purchases</li>
      </ul>

      <h3>Step 3: Monitor Your Progress</h3>

      <p>Track your credit building with free resources:</p>
      <ul>
        <li><strong>Credit Karma</strong> - Free credit scores and monitoring</li>
        <li><strong>annualcreditreport.com</strong> - Free annual credit reports</li>
        <li><strong>Your bank's app</strong> - Many offer free credit score tracking</li>
      </ul>

      <h3>Timeline Expectations</h3>

      <ul>
        <li><strong>Month 1-3:</strong> Apply for and receive your first credit card</li>
        <li><strong>Month 3-6:</strong> Establish payment history, see first credit score</li>
        <li><strong>Month 6-12:</strong> Score improves to 650-700 range with responsible use</li>
        <li><strong>Month 12+:</strong> Eligible for better credit cards and rates</li>
      </ul>

      <h3>Common Mistakes to Avoid</h3>

      <ul>
        <li><strong>Closing your first card:</strong> Keep it open to maintain credit history length</li>
        <li><strong>Applying for multiple cards quickly:</strong> This can hurt your score</li>
        <li><strong>Using credit for purchases you can't afford:</strong> Only spend what you can pay off</li>
        <li><strong>Ignoring your credit report:</strong> Check for errors regularly</li>
      </ul>

      <p>Building credit is a marathon, not a sprint. Stay patient, consistent, and responsible - your future self will thank you!</p>
    `,
    quiz: [
      {
        id: 1,
        question: "What's the most important factor in your credit score?",
        options: ["Credit utilization", "Payment history", "Length of credit history", "Credit mix"],
        correctAnswer: 1,
        explanation: "Payment history accounts for 35% of your credit score - making payments on time is the most important factor."
      },
      {
        id: 2,
        question: "What's the ideal credit utilization ratio for building good credit?",
        options: ["Under 50%", "Under 30%", "Under 10%", "It doesn't matter"],
        correctAnswer: 2,
        explanation: "While under 30% is acceptable, keeping utilization under 10% is ideal for the best credit score impact."
      },
      {
        id: 3,
        question: "How long does it typically take to see your first credit score?",
        options: ["1 month", "3-6 months", "1 year", "2 years"],
        correctAnswer: 1,
        explanation: "You typically need 3-6 months of credit history before credit scoring models can generate your first score."
      },
      {
        id: 4,
        question: "Which option is best for someone with no credit history?",
        options: ["Premium rewards card", "Secured credit card", "Store credit card", "Business credit card"],
        correctAnswer: 1,
        explanation: "Secured credit cards are designed for people with no credit history and are the most accessible option for beginners."
      }
    ]
  },

  'emergency-fund-basics': {
    id: 'emergency-fund-basics',
    title: 'Emergency Fund Basics: Your Financial Safety Net',
    category: 'Saving',
    difficulty: 'Beginner',
    points: 20,
    estimatedTime: '10 minutes',
    completed: false,
    content: `
      <h2>What is an Emergency Fund?</h2>
      <p>An emergency fund is money you set aside specifically for unexpected expenses or financial emergencies. Think of it as your financial safety net.</p>

      <h3>Why You Need One</h3>
      <ul>
        <li><strong>Unexpected expenses:</strong> Car repairs, medical bills, or home maintenance</li>
        <li><strong>Job loss:</strong> Provides income replacement while you find new work</li>
        <li><strong>Peace of mind:</strong> Reduces stress and anxiety about money</li>
        <li><strong>Avoid debt:</strong> Prevents you from relying on credit cards or loans</li>
      </ul>

      <h3>How Much Should You Save?</h3>
      <p>Financial experts recommend saving 3-6 months' worth of living expenses. Start small:</p>
      <ol>
        <li><strong>Starter goal:</strong> $500-$1,000</li>
        <li><strong>Intermediate goal:</strong> 1 month of expenses</li>
        <li><strong>Full goal:</strong> 3-6 months of expenses</li>
      </ol>

      <h3>Where to Keep Your Emergency Fund</h3>
      <p>Your emergency fund should be easily accessible but separate from your daily spending money:</p>
      <ul>
        <li>High-yield savings account</li>
        <li>Money market account</li>
        <li>Short-term certificate of deposit (CD)</li>
      </ul>

      <div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
        <strong>💡 Pro Tip:</strong> Set up automatic transfers to build your emergency fund gradually. Even $25 per week adds up to $1,300 per year!
      </div>
    `,
    quiz: [
      {
        id: 1,
        question: "What is the primary purpose of an emergency fund?",
        options: [
          "To invest in the stock market",
          "To cover unexpected expenses and financial emergencies",
          "To buy luxury items",
          "To pay for vacation expenses"
        ],
        correctAnswer: 1,
        explanation: "An emergency fund is specifically designed to cover unexpected expenses like medical bills, car repairs, or job loss, providing financial security."
      },
      {
        id: 2,
        question: "How much should you ideally have in your emergency fund?",
        options: [
          "1 week of expenses",
          "1 month of expenses",
          "3-6 months of expenses",
          "1 year of expenses"
        ],
        correctAnswer: 2,
        explanation: "Most financial experts recommend 3-6 months of living expenses, though you can start with smaller goals like $500-$1,000."
      },
      {
        id: 3,
        question: "Where is the best place to keep your emergency fund?",
        options: [
          "Under your mattress",
          "In your checking account with daily expenses",
          "In a high-yield savings account",
          "Invested in stocks"
        ],
        correctAnswer: 2,
        explanation: "A high-yield savings account provides easy access while keeping the money separate from daily spending and earning interest."
      }
    ]
  },

  'debt-snowball-avalanche': {
    id: 'debt-snowball-avalanche',
    title: 'Debt Snowball vs. Avalanche: Which Strategy Wins?',
    category: 'Debt',
    difficulty: 'Intermediate',
    points: 20,
    estimatedTime: '12 minutes',
    completed: false,
    content: `
      <h2>Debt Snowball vs. Avalanche: The Ultimate Showdown</h2>

      <p>Both the debt snowball and debt avalanche methods can help you become debt-free, but they work very differently. Let's explore both strategies and help you choose the right one for your situation.</p>

      <div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; margin: 1rem 0; border-left: 4px solid #3b82f6;">
        <strong>💡 Key Insight:</strong> The best debt payoff strategy is the one you'll actually stick with long-term!
      </div>

      <h3>The Debt Snowball Method</h3>

      <p><strong>How It Works:</strong></p>
      <ol>
        <li>List all debts from smallest to largest balance</li>
        <li>Pay minimums on all debts</li>
        <li>Put every extra dollar toward the smallest debt</li>
        <li>Once smallest debt is paid off, roll that payment to the next smallest</li>
        <li>Repeat until all debts are eliminated</li>
      </ol>

      <h3>The Debt Avalanche Method</h3>

      <p><strong>How It Works:</strong></p>
      <ol>
        <li>List all debts from highest to lowest interest rate</li>
        <li>Pay minimums on all debts</li>
        <li>Put every extra dollar toward the highest interest rate debt</li>
        <li>Once highest rate debt is paid off, move to the next highest</li>
        <li>Continue until debt-free</li>
      </ol>

      <div style="background: #fef2f2; padding: 1rem; border-radius: 8px; margin: 1rem 0; border-left: 4px solid #ef4444;">
        <strong>⚠️ Reality Check:</strong> The avalanche method typically saves only $50-200 compared to snowball for average debt loads.
      </div>

      <h3>Which Method Should You Choose?</h3>

      <p><strong>Choose Debt Snowball If:</strong></p>
      <ul>
        <li>You need motivation and quick wins</li>
        <li>You've struggled to stick with debt payoff before</li>
        <li>Your interest rates are relatively similar</li>
        <li>You have many small debts</li>
      </ul>

      <p><strong>Choose Debt Avalanche If:</strong></p>
      <ul>
        <li>You're highly motivated by math and logic</li>
        <li>You have significant interest rate differences</li>
        <li>Maximizing savings is your top priority</li>
        <li>You have high-interest debt (20%+ APR)</li>
      </ul>
    `,
    quiz: [
      {
        id: 1,
        question: "What's the main difference between debt snowball and debt avalanche methods?",
        options: ["Snowball focuses on highest interest rates first", "Avalanche focuses on smallest balances first", "Snowball focuses on smallest balances first", "They are exactly the same method"],
        correctAnswer: 2,
        explanation: "Debt snowball prioritizes smallest balances for quick psychological wins, while debt avalanche prioritizes highest interest rates to save money."
      },
      {
        id: 2,
        question: "Which debt payoff method typically saves the most money in interest?",
        options: ["Debt snowball", "Debt avalanche", "They save the same amount", "It depends on your credit score"],
        correctAnswer: 1,
        explanation: "Debt avalanche saves more money because you tackle high-interest debt first, reducing the total interest paid over time."
      },
      {
        id: 3,
        question: "What should you do before aggressively paying off debt?",
        options: ["Invest in stocks", "Buy a house", "Build a small emergency fund", "Get another credit card"],
        correctAnswer: 2,
        explanation: "Having a small emergency fund ($500-$1,000) prevents you from going further into debt when unexpected expenses arise during your payoff journey."
      }
    ]
  },

  'investing-basics': {
    id: 'investing-basics',
    title: 'Investment Basics for Beginners',
    category: 'Investing',
    difficulty: 'Beginner',
    points: 20,
    estimatedTime: '12 minutes',
    completed: false,
    content: `
      <h2>Your First Steps Into Investing</h2>
      <p>Investing isn't just for rich people or Wall Street experts. With as little as $1, you can start building wealth for your future.</p>

      <h3>Why Start Investing Now?</h3>
      <ul>
        <li><strong>Compound interest:</strong> Your money grows exponentially over time</li>
        <li><strong>Beat inflation:</strong> Protect your purchasing power</li>
        <li><strong>Build wealth:</strong> Create financial freedom for the future</li>
        <li><strong>Retirement security:</strong> Social Security alone won't be enough</li>
      </ul>

      <h3>The Power of Starting Early</h3>
      <div style="background: #f0fdf4; padding: 1.5rem; border-radius: 12px; margin: 1rem 0; border: 2px solid #10b981;">
        <h4 style="color: #047857; margin-top: 0;">Example: The $100/Month Investor</h4>
        <div style="display: flex; gap: 1rem; margin-top: 1rem;">
          <div style="flex: 1; background: white; padding: 1rem; border-radius: 8px;">
            <strong>Starting at 25:</strong>
            <br>$100/month for 40 years
            <br>Total invested: $48,000
            <br><span style="color: #10b981; font-size: 1.2em; font-weight: bold;">Final value: $525,000</span>
          </div>
          <div style="flex: 1; background: white; padding: 1rem; border-radius: 8px;">
            <strong>Starting at 35:</strong>
            <br>$100/month for 30 years
            <br>Total invested: $36,000
            <br><span style="color: #f59e0b; font-size: 1.2em; font-weight: bold;">Final value: $249,000</span>
          </div>
        </div>
        <p style="margin-top: 1rem; margin-bottom: 0; font-style: italic;">*Assuming 7% annual return</p>
      </div>

      <h3>Investment Account Types</h3>
      <ol>
        <li><strong>401(k) - Employer Match First</strong>
          <ul>
            <li>Free money from employer matching</li>
            <li>Tax advantages</li>
            <li>Automatic payroll deduction</li>
          </ul>
        </li>
        <li><strong>Roth IRA - Tax-Free Growth</strong>
          <ul>
            <li>Contribute after-tax dollars</li>
            <li>Tax-free withdrawals in retirement</li>
            <li>More investment options</li>
          </ul>
        </li>
        <li><strong>Taxable Brokerage - Full Flexibility</strong>
          <ul>
            <li>No contribution limits</li>
            <li>Access money anytime</li>
            <li>Pay taxes on gains</li>
          </ul>
        </li>
      </ol>

      <div style="background: #fef3c7; padding: 1rem; border-radius: 8px; margin: 1rem 0; border-left: 4px solid #f59e0b;">
        <strong>💡 Pro Tip:</strong> Start with just 1% of your income if money is tight. Increase by 1% each year or whenever you get a raise.
      </div>
    `,
    quiz: [
      {
        id: 1,
        question: "What's the most important factor in building wealth through investing?",
        options: ["Picking individual stocks", "Starting early", "Investing large amounts", "Timing the market"],
        correctAnswer: 1,
        explanation: "Time is the most powerful factor in investing due to compound interest. Starting early, even with small amounts, is more effective than waiting to invest larger amounts later."
      },
      {
        id: 2,
        question: "What should you prioritize before investing in a Roth IRA?",
        options: ["Buying individual stocks", "Getting your full employer 401(k) match", "Investing in cryptocurrency", "Paying off your mortgage"],
        correctAnswer: 1,
        explanation: "Employer 401(k) matching is free money that provides an immediate 100% return on your investment, making it the highest priority."
      },
      {
        id: 3,
        question: "What type of investment is best for complete beginners?",
        options: ["Individual stocks", "Target-date funds", "Cryptocurrency", "Real estate"],
        correctAnswer: 1,
        explanation: "Target-date funds automatically diversify and adjust your investments based on your retirement timeline, making them perfect for beginners who want a 'set it and forget it' approach."
      }
    ]
  },
  'emergency-fund-detailed': {
    id: 'emergency-fund-detailed',
    title: 'Building a Detailed Emergency Fund',
    category: 'Saving',
    difficulty: 'Intermediate',
    points: 20,
    estimatedTime: '15 minutes',
    completed: false,
    content: `
      <h2>Detailed Guide to Building Your Emergency Fund</h2>
      <p>A comprehensive guide to building and managing a robust emergency fund for long-term financial security.</p>
    `,
    quiz: [
      {
        id: 1,
        question: "What is a key consideration when building an emergency fund?",
        options: ["Liquidity", "High returns", "Tax benefits", "Low risk"],
        correctAnswer: 0,
        explanation: "Liquidity is crucial for an emergency fund, ensuring quick access to funds when needed."
      }
    ]
  },
  'financial-goal-setting': {
    id: 'financial-goal-setting',
    title: 'Setting SMART Financial Goals',
    category: 'Planning',
    difficulty: 'Beginner',
    points: 20,
    estimatedTime: '10 minutes',
    completed: false,
    content: `
      <h2>How to Set and Achieve Your Financial Goals</h2>
      <p>Learn the SMART framework to set and achieve your financial goals effectively.</p>
    `,
    quiz: [
      {
        id: 1,
        question: "What does SMART stand for in financial goal setting?",
        options: ["Simple, Measurable, Achievable, Relevant, Time-bound", "Specific, Measurable, Achievable, Relevant, Time-bound", "Strategic, Measurable, Actionable, Realistic, Timely", "Simple, Manageable, Attainable, Realistic, Trackable"],
        correctAnswer: 1,
        explanation: "SMART stands for Specific, Measurable, Achievable, Relevant, Time-bound, which are the key elements of effective goal setting."
      }
    ]
  },
  'understanding-credit-scores': {
    id: 'understanding-credit-scores',
    title: 'Understanding Credit Scores: A Comprehensive Guide',
    category: 'Credit',
    difficulty: 'Intermediate',
    points: 20,
    estimatedTime: '15 minutes',
    completed: false,
    content: `
      <h2>A Deep Dive into Credit Scores</h2>
      <p>A detailed guide on understanding credit scores, factors affecting them, and how to improve them.</p>
    `,
    quiz: [
      {
        id: 1,
        question: "Which factor has the highest impact on your credit score?",
        options: ["Payment history", "Credit utilization", "Length of credit history", "Credit mix"],
        correctAnswer: 0,
        explanation: "Payment history has the highest impact, accounting for 35% of your credit score."
      }
    ]
  },
  'estate-planning-basics': {
    id: 'estate-planning-basics',
    title: 'Estate Planning Basics',
    category: 'Planning',
    difficulty: 'Advanced',
    points: 20,
    estimatedTime: '20 minutes',
    completed: false,
    content: `
      <h2>Introduction to Estate Planning</h2>
      <p>Learn the basics of estate planning to protect your assets and ensure your wishes are followed.</p>
    `,
    quiz: [
      {
        id: 1,
        question: "What is the primary purpose of estate planning?",
        options: ["To minimize taxes", "To distribute assets after death", "To avoid probate", "To maximize investment returns"],
        correctAnswer: 1,
        explanation: "The primary purpose is to ensure your assets are distributed according to your wishes after your death."
      }
    ]
  },
  'insurance-essentials': {
    id: 'insurance-essentials',
    title: 'Insurance Essentials: Protecting Your Assets',
    category: 'Insurance',
    difficulty: 'Beginner',
    points: 20,
    estimatedTime: '12 minutes',
    completed: false,
    content: `
      <h2>Key Insurance Types You Should Know</h2>
      <p>Learn about essential insurance types, including health, auto, home, and life insurance.</p>
    `,
    quiz: [
      {
        id: 1,
        question: "Which type of insurance protects your home from damage?",
        options: ["Health insurance", "Auto insurance", "Home insurance", "Life insurance"],
        correctAnswer: 2,
        explanation: "Home insurance protects your home from various damages, such as fire, storms, and theft."
      }
    ]
  },
  'managing-student-loans': {
    id: 'managing-student-loans',
    title: 'Managing Student Loans Effectively',
    category: 'Debt',
    difficulty: 'Intermediate',
    points: 20,
    estimatedTime: '15 minutes',
    completed: false,
    content: `
      <h2>Strategies for Managing and Paying Off Student Loans</h2>
      <p>Learn effective strategies for managing your student loans, including refinancing, consolidation, and repayment plans.</p>
    `,
    quiz: [
      {
        id: 1,
        question: "What is refinancing student loans?",
        options: ["Combining multiple loans into one", "Lowering the interest rate on your loan", "Deferring loan payments", "Forgiving loan debt"],
        correctAnswer: 1,
        explanation: "Refinancing involves replacing existing loans with a new loan, often to secure a lower interest rate."
      }
    ]
  },
  'saving-for-retirement': {
    id: 'saving-for-retirement',
    title: 'Saving Early for Retirement',
    category: 'Saving',
    difficulty: 'Intermediate',
    points: 20,
    estimatedTime: '18 minutes',
    completed: false,
    content: `
      <h2>Why Saving Early for Retirement Matters</h2>
      <p>Understand the importance of starting to save for retirement early and the impact of compound interest.</p>
    `,
    quiz: [
      {
        id: 1,
        question: "What is the key benefit of starting to save for retirement early?",
        options: ["Higher initial investment", "More time for compound interest to work", "Lower tax rates", "Guaranteed investment returns"],
        correctAnswer: 1,
        explanation: "Starting early allows more time for compound interest to grow your savings significantly."
      }
    ]
  },
  'understanding-taxes': {
    id: 'understanding-taxes',
    title: 'Understanding US Taxes: A Beginner\'s Guide',
    category: 'Taxes',
    difficulty: 'Beginner',
    points: 20,
    estimatedTime: '10 minutes',
    completed: false,
    content: `
      <h2>Introduction to US Taxes</h2>
      <p>A simple guide to understanding the basics of the US tax system, including income tax, deductions, and credits.</p>
    `,
    quiz: [
      {
        id: 1,
        question: "What is a tax deduction?",
        options: ["A direct reduction in taxes owed", "A reduction in taxable income", "A tax credit", "A tax refund"],
        correctAnswer: 1,
        explanation: "A tax deduction reduces your taxable income, which in turn reduces the amount of taxes you owe."
      }
    ]
  },
  'advanced-investment-strategies': {
    id: 'advanced-investment-strategies',
    title: 'Advanced Investment Strategies',
    category: 'Investing',
    difficulty: 'Advanced',
    points: 20,
    estimatedTime: '25 minutes',
    completed: false,
    content: `
      <h2>Exploring Advanced Investment Techniques</h2>
      <p>Learn about advanced investment strategies, including options trading, real estate, and alternative investments.</p>
    `,
    quiz: [
      {
        id: 1,
        question: "What is options trading?",
        options: ["Buying and selling stocks", "Trading contracts that give the right to buy or sell an asset at a specific price", "Investing in mutual funds", "Trading bonds"],
        correctAnswer: 1,
        explanation: "Options trading involves contracts that give the buyer the right, but not the obligation, to buy or sell an underlying asset at a predetermined price before a specified date."
      }
    ]
  },
  'charitable-giving-strategies': {
    id: 'charitable-giving-strategies',
    title: 'Effective Charitable Giving Strategies',
    category: 'Taxes',
    difficulty: 'Intermediate',
    points: 20,
    estimatedTime: '15 minutes',
    completed: false,
    content: `
      <h2>Maximize Your Impact with Strategic Charitable Giving</h2>
      <p>Learn how to maximize your charitable impact while optimizing your tax benefits through strategic giving.</p>
    `,
    quiz: [
      {
        id: 1,
        question: "What is a donor-advised fund?",
        options: ["A savings account for charitable donations", "An investment account for charitable giving that offers immediate tax benefits", "A fund managed by the government", "A type of scholarship"],
        correctAnswer: 1,
        explanation: "A donor-advised fund is an investment account for charitable giving that offers immediate tax benefits and allows you to distribute funds to charities over time."
      }
    ]
  },
  'home-buying-process': {
    id: 'home-buying-process',
    title: 'The Home Buying Process: A Step-by-Step Guide',
    category: 'Planning',
    difficulty: 'Intermediate',
    points: 20,
    estimatedTime: '20 minutes',
    completed: false,
    content: `
      <h2>Navigating the Home Buying Journey</h2>
      <p>A detailed guide to navigating the home buying process, from pre-approval to closing.</p>
    `,
    quiz: [
      {
        id: 1,
        question: "What is pre-approval in the home buying process?",
        options: ["A final loan approval", "An estimate of how much you can borrow", "A home inspection", "An appraisal"],
        correctAnswer: 1,
        explanation: "Pre-approval is an estimate from a lender of how much you can borrow, based on your financial information."
      }
    ]
  },
  'retirement-income-planning': {
    id: 'retirement-income-planning',
    title: 'Retirement Income Planning',
    category: 'Planning',
    difficulty: 'Advanced',
    points: 20,
    estimatedTime: '25 minutes',
    completed: false,
    content: `
      <h2>Strategies for Generating Income in Retirement</h2>
      <p>Learn strategies for generating a sustainable income stream in retirement, including withdrawals, annuities, and Social Security optimization.</p>
    `,
    quiz: [
      {
        id: 1,
        question: "What is an annuity?",
        options: ["A type of stock", "A contract that provides a guaranteed income stream", "A retirement savings account", "A type of bond"],
        correctAnswer: 1,
        explanation: "An annuity is a contract with an insurance company that provides a guaranteed stream of income in retirement, in exchange for a lump sum or series of payments."
      }
    ]
  },
  'tax-efficient-investing': {
    id: 'tax-efficient-investing',
    title: 'Tax-Efficient Investing Strategies',
    category: 'Taxes',
    difficulty: 'Intermediate',
    points: 20,
    estimatedTime: '20 minutes',
    completed: false,
    content: `
      <h2>Minimize Taxes on Your Investments</h2>
      <p>Learn how to minimize taxes on your investments through tax-advantaged accounts and tax-efficient strategies.</p>
    `,
    quiz: [
      {
        id: 1,
        question: "What is a tax-loss harvesting?",
        options: ["Selling investments at a loss to offset capital gains", "Avoiding paying taxes on investments", "Investing in tax-exempt bonds", "Donating investments to charity"],
        correctAnswer: 0,
        explanation: "Tax-loss harvesting involves selling investments at a loss to offset capital gains, reducing your overall tax liability."
      }
    ]
  },
  'understanding-cryptocurrency': {
    id: 'understanding-cryptocurrency',
    title: 'Understanding Cryptocurrency',
    category: 'Investing',
    difficulty: 'Advanced',
    points: 20,
    estimatedTime: '22 minutes',
    completed: false,
    content: `
      <h2>Introduction to Cryptocurrency</h2>
      <p>A comprehensive guide to understanding the basics of cryptocurrency, including blockchain technology, Bitcoin, and Ethereum.</p>
    `,
    quiz: [
      {
        id: 1,
        question: "What is blockchain technology?",
        options: ["A type of cryptocurrency", "A decentralized ledger that records transactions", "A government-regulated financial system", "A type of computer hardware"],
        correctAnswer: 1,
        explanation: "Blockchain is a decentralized, digital ledger that records transactions across many computers. It is used to secure and verify transactions without a central authority."
      }
    ]
  },
  'credit-card-rewards': {
    id: 'credit-card-rewards',
    title: 'Maximizing Credit Card Rewards',
    category: 'Credit',
    difficulty: 'Intermediate',
    points: 20,
    estimatedTime: '18 minutes',
    completed: false,
    content: `
      <h2>Strategies for Earning and Using Credit Card Rewards</h2>
      <p>Learn how to maximize your credit card rewards, including cashback, points, and miles, to get the most value from your spending.</p>
    `,
    quiz: [
      {
        id: 1,
        question: "What is the best way to maximize credit card rewards?",
        options: ["Spending more money", "Choosing a card that aligns with your spending habits", "Paying only the minimum balance", "Applying for multiple credit cards"],
        correctAnswer: 1,
        explanation: "The best way to maximize rewards is to choose a credit card that aligns with your spending habits, such as a card that offers bonus rewards on groceries if you spend a lot on groceries."
      }
    ]
  },

  // NEW MODULES BATCH 1
  'budgeting-variable-expenses': {
    id: 'budgeting-variable-expenses',
    title: 'Mastering Variable Expenses in Your Budget',
    category: 'Budgeting',
    difficulty: 'Intermediate',
    points: 20,
    estimatedTime: '15 min',
    completed: false,
    content: `
      <h2>Understanding Variable Expenses</h2>
      
      <p>Variable expenses change month-to-month, like groceries or gas. Unlike fixed expenses, they require active management to avoid overspending.</p>

      <h3>Examples of Variable Expenses</h3>
      <ul>
        <li>Dining out</li>
        <li>Entertainment</li>
        <li>Fuel</li>
        <li>Groceries</li>
      </ul>

      <h3>Managing These Costs</h3>
      <p>Use spending caps and track them weekly using apps or spreadsheets. Build flexibility into your budget by setting aside a buffer.</p>
    `,
    quiz: [
      {
        id: 1,
        question: "Which of the following is a variable expense?",
        options: ["Rent", "Car payment", "Internet bill", "Groceries"],
        correctAnswer: 3,
        explanation: "Groceries vary in cost month to month, making them a variable expense."
      },
      {
        id: 2,
        question: "What's one way to manage variable expenses?",
        options: ["Ignore them", "Use a credit card", "Set a weekly spending limit", "Cancel fixed bills"],
        correctAnswer: 2,
        explanation: "Setting weekly caps helps manage variable spending within your budget."
      }
    ]
  },

  'saving-windfalls': {
    id: 'saving-windfalls',
    title: 'What to Do With a Financial Windfall',
    category: 'Saving',
    difficulty: 'Intermediate',
    points: 20,
    estimatedTime: '15 min',
    completed: false,
    content: `
      <h2>Handling Unexpected Money Wisely</h2>
      
      <p>Windfalls like tax refunds, bonuses, or inheritances are opportunities to accelerate financial goals—not splurge.</p>

      <h3>Prioritization Strategy</h3>
      <ul>
        <li>Pay off high-interest debt</li>
        <li>Build or top off emergency fund</li>
        <li>Invest for long-term goals</li>
        <li>Set aside for personal enjoyment (10%–20%)</li>
      </ul>

      <p>Resist lifestyle inflation by applying a clear plan before spending.</p>
    `,
    quiz: [
      {
        id: 1,
        question: "What is a financial windfall?",
        options: ["Regular paycheck", "Tax bill", "Unexpected money received", "Mortgage payment"],
        correctAnswer: 2,
        explanation: "A windfall is money received unexpectedly, like a bonus or inheritance."
      },
      {
        id: 2,
        question: "What's the recommended first step with a windfall?",
        options: ["Spend it all", "Buy luxury items", "Pay off high-interest debt", "Ignore it"],
        correctAnswer: 2,
        explanation: "Prioritizing debt can free future cash flow and reduce interest payments."
      }
    ]
  },

  'investing-dividends': {
    id: 'investing-dividends',
    title: 'How Dividend Investing Works',
    category: 'Investing',
    difficulty: 'Intermediate',
    points: 25,
    estimatedTime: '20 min',
    completed: false,
    content: `
      <h2>Dividend Investing Basics</h2>
      
      <p>Dividends are periodic payments made to shareholders from a company's earnings. Some investors build portfolios focused on dividend-paying stocks for regular income.</p>

      <h3>Key Benefits</h3>
      <ul>
        <li>Stable income stream</li>
        <li>Reinvesting dividends for compounding growth</li>
        <li>Often from well-established companies</li>
      </ul>

      <h3>Considerations</h3>
      <p>Dividend yields vary and can change. Not all stocks pay dividends. Always review company fundamentals before investing solely for dividends.</p>
    `,
    quiz: [
      {
        id: 1,
        question: "What are dividends?",
        options: ["Company debt", "Taxes", "Employee bonuses", "Payments to shareholders"],
        correctAnswer: 3,
        explanation: "Dividends are payouts to shareholders from company profits."
      },
      {
        id: 2,
        question: "Why might someone focus on dividend investing?",
        options: ["High risk", "Short-term gains", "Consistent income", "No taxes"],
        correctAnswer: 2,
        explanation: "Dividend investors seek regular, passive income."
      }
    ]
  },

  'credit-inquiries': {
    id: 'credit-inquiries',
    title: 'How Credit Inquiries Affect Your Score',
    category: 'Credit',
    difficulty: 'Intermediate',
    points: 20,
    estimatedTime: '15 min',
    completed: false,
    content: `
      <h2>Understanding Credit Inquiries</h2>
      
      <p>Credit inquiries occur when a lender checks your credit report. There are two types: soft and hard inquiries.</p>

      <h3>Types of Inquiries</h3>
      <ul>
        <li><strong>Soft Inquiries:</strong> Do not affect your score (e.g., checking your own credit)</li>
        <li><strong>Hard Inquiries:</strong> Can lower your score slightly and occur during loan applications</li>
      </ul>

      <h3>Limiting Inquiries</h3>
      <p>Multiple inquiries in a short time can compound the impact. Space out credit applications when possible.</p>
    `,
    quiz: [
      {
        id: 1,
        question: "What type of inquiry affects your credit score?",
        options: ["Soft inquiry", "Hard inquiry", "Job interview", "Bank transfer"],
        correctAnswer: 1,
        explanation: "Hard inquiries from lenders can slightly lower your score."
      },
      {
        id: 2,
        question: "Which of these is a soft credit inquiry?",
        options: ["Applying for a car loan", "Lender checking for mortgage", "You checking your own score", "Credit card application"],
        correctAnswer: 2,
        explanation: "When you check your own score, it's a soft inquiry with no impact."
      }
    ]
  },

  'debt-secured-vs-unsecured': {
    id: 'debt-secured-vs-unsecured',
    title: 'Secured vs. Unsecured Debt',
    category: 'Debt',
    difficulty: 'Beginner',
    points: 15,
    estimatedTime: '10 min',
    completed: false,
    content: `
      <h2>Types of Debt</h2>
      
      <p>Debt falls into two categories: secured and unsecured. Understanding the difference helps you evaluate risk and repayment terms.</p>

      <h3>Secured Debt</h3>
      <ul>
        <li>Backed by collateral (e.g., mortgage, car loan)</li>
        <li>Lower interest rates</li>
      </ul>

      <h3>Unsecured Debt</h3>
      <ul>
        <li>No collateral (e.g., credit cards, student loans)</li>
        <li>Higher interest rates due to risk</li>
      </ul>
    `,
    quiz: [
      {
        id: 1,
        question: "Which is an example of secured debt?",
        options: ["Credit card", "Student loan", "Mortgage", "Personal loan"],
        correctAnswer: 2,
        explanation: "Mortgages are secured by the home itself as collateral."
      }
    ]
  },

  'tax-deductions-vs-credits': {
    id: 'tax-deductions-vs-credits',
    title: 'Tax Deductions vs. Tax Credits',
    category: 'Taxes',
    difficulty: 'Beginner',
    points: 15,
    estimatedTime: '10 min',
    completed: false,
    content: `
      <h2>Understanding Tax Breaks</h2>
      
      <p>Tax deductions reduce your taxable income. Tax credits reduce the actual amount you owe.</p>

      <h3>Key Difference</h3>
      <p><strong>Deduction:</strong> Saves you money equal to your tax rate times the deduction amount</p>
      <p><strong>Credit:</strong> Saves you dollar-for-dollar the credit amount</p>

      <h3>Examples</h3>
      <ul>
        <li><strong>Deductions:</strong> Mortgage interest, charitable donations</li>
        <li><strong>Credits:</strong> Child tax credit, education credits</li>
      </ul>
    `,
    quiz: [
      {
        id: 1,
        question: "Which provides more tax savings?",
        options: ["$1,000 deduction", "$1,000 credit", "They're equal", "Depends on income"],
        correctAnswer: 1,
        explanation: "A credit saves you the full amount, while a deduction only saves your tax rate times the deduction."
      },
      {
        id: 2,
        question: "What does a tax deduction do?",
        options: ["Reduces taxes owed dollar-for-dollar", "Reduces taxable income", "Increases refund", "Eliminates taxes"],
        correctAnswer: 1,
        explanation: "Deductions reduce your taxable income, which then reduces your tax bill based on your tax rate."
      }
    ]
  },

  // NEW MODULES BATCH 2
  'cash-flow-analysis': {
    id: 'cash-flow-analysis',
    title: 'Mastering Cash Flow Analysis',
    category: 'Budgeting',
    difficulty: 'Intermediate',
    points: 20,
    estimatedTime: '15 min',
    completed: false,
    content: `
      <h2>What is Cash Flow Analysis?</h2>
      
      <p>Cash flow analysis helps you understand where your money is coming from and where it's going.</p>

      <h3>Benefits</h3>
      <ul>
        <li>Tracks income vs expenses</li>
        <li>Identifies spending leaks</li>
        <li>Helps improve saving habits</li>
      </ul>
    `,
    quiz: [
      {
        id: 1,
        question: "What is the main purpose of cash flow analysis?",
        options: ["To calculate your net worth", "To predict future interest rates", "To understand income and expenses", "To invest in stocks"],
        correctAnswer: 2,
        explanation: "Cash flow analysis focuses on tracking money coming in and going out."
      }
    ]
  },

  'sinking-funds': {
    id: 'sinking-funds',
    title: 'Sinking Funds: Save Smarter for Irregular Expenses',
    category: 'Saving',
    difficulty: 'Intermediate',
    points: 20,
    estimatedTime: '15 min',
    completed: false,
    content: `
      <h2>What is a Sinking Fund?</h2>
      
      <p>A sinking fund is money you save monthly for predictable but irregular expenses, like holidays or car maintenance.</p>

      <h3>Why Use One?</h3>
      <ul>
        <li>Reduces reliance on credit</li>
        <li>Prevents budget disruptions</li>
        <li>Builds discipline</li>
      </ul>
    `,
    quiz: [
      {
        id: 1,
        question: "What is the main benefit of a sinking fund?",
        options: ["Investing in the stock market", "Paying off debt faster", "Avoiding surprise expenses", "Getting a tax refund"],
        correctAnswer: 2,
        explanation: "Sinking funds help you prepare for non-monthly but expected costs."
      }
    ]
  },

  'roth-vs-traditional-ira': {
    id: 'roth-vs-traditional-ira',
    title: 'Roth vs. Traditional IRA: Which Should You Choose?',
    category: 'Investing',
    difficulty: 'Intermediate',
    points: 25,
    estimatedTime: '20 min',
    completed: false,
    content: `
      <h2>Key Differences</h2>
      
      <p>Roth IRA contributions are made after-tax, but withdrawals are tax-free. Traditional IRAs are pre-tax but taxed upon withdrawal.</p>

      <h3>Which is Better?</h3>
      <ul>
        <li>Roth is ideal if you expect higher future tax rates</li>
        <li>Traditional works if you want tax deductions now</li>
      </ul>
    `,
    quiz: [
      {
        id: 1,
        question: "Which IRA offers tax-free withdrawals in retirement?",
        options: ["Traditional IRA", "Roth IRA", "SEP IRA", "401(k)"],
        correctAnswer: 1,
        explanation: "Roth IRAs are funded with after-tax dollars, so withdrawals are tax-free."
      }
    ]
  },

  'credit-utilization': {
    id: 'credit-utilization',
    title: 'Credit Utilization: A Key to Your Credit Score',
    category: 'Credit',
    difficulty: 'Intermediate',
    points: 20,
    estimatedTime: '15 min',
    completed: false,
    content: `
      <h2>Understanding Credit Utilization</h2>
      
      <p>Your credit utilization ratio is the amount of credit you're using compared to your total limit. Aim to keep it below 30%.</p>

      <h3>Improving Your Score</h3>
      <ul>
        <li>Pay down balances</li>
        <li>Request higher limits</li>
        <li>Avoid maxing out cards</li>
      </ul>
    `,
    quiz: [
      {
        id: 1,
        question: "What is the recommended credit utilization ratio?",
        options: ["90%", "50%", "30%", "10%"],
        correctAnswer: 2,
        explanation: "Experts suggest keeping credit usage below 30% of your available limit."
      }
    ]
  },

  'debt-to-income-ratio': {
    id: 'debt-to-income-ratio',
    title: 'Understanding Your Debt-to-Income Ratio',
    category: 'Debt',
    difficulty: 'Intermediate',
    points: 20,
    estimatedTime: '15 min',
    completed: false,
    content: `
      <h2>What is DTI?</h2>
      
      <p>Debt-to-Income (DTI) ratio compares your monthly debt payments to your gross income. Lenders use it to evaluate your ability to repay loans.</p>

      <h3>Healthy Ratio</h3>
      <ul>
        <li>Below 36% is generally considered good</li>
        <li>High DTI can hurt your borrowing chances</li>
      </ul>
    `,
    quiz: [
      {
        id: 1,
        question: "What does a high debt-to-income ratio indicate?",
        options: ["High income", "Low debt", "Financial stability", "Potential repayment difficulty"],
        correctAnswer: 3,
        explanation: "A high DTI means a large portion of income goes toward debt, which may concern lenders."
      }
    ]
  },

  'building-wealth-mindset': {
    id: 'building-wealth-mindset',
    title: 'Building a Wealth Mindset',
    category: 'Planning',
    difficulty: 'Beginner',
    points: 20,
    estimatedTime: '15 min',
    completed: false,
    content: `
      <h2>What is a Wealth Mindset?</h2>
      
      <p>A wealth mindset involves thinking long-term, prioritizing growth, and managing money wisely.</p>

      <h3>Steps to Cultivate It</h3>
      <ul>
        <li>Set clear goals</li>
        <li>Invest in learning</li>
        <li>Stay disciplined</li>
      </ul>
    `,
    quiz: [
      {
        id: 1,
        question: "Which is a key trait of a wealth mindset?",
        options: ["Living paycheck to paycheck", "Impulse spending", "Short-term thinking", "Goal orientation"],
        correctAnswer: 3,
        explanation: "A wealth mindset focuses on long-term goals and financial discipline."
      }
    ]
  },

  'renters-insurance-basics': {
    id: 'renters-insurance-basics',
    title: 'Renter\'s Insurance Basics',
    category: 'Insurance',
    difficulty: 'Beginner',
    points: 20,
    estimatedTime: '15 min',
    completed: false,
    content: `
      <h2>What is Renter\'s Insurance?</h2>
      
      <p>It protects your belongings in a rental home against theft, fire, or damage.</p>

      <h3>Why You Need It</h3>
      <ul>
        <li>Landlord\'s insurance doesn\'t cover your stuff</li>
        <li>Liability protection</li>
        <li>Affordable and valuable</li>
      </ul>
    `,
    quiz: [
      {
        id: 1,
        question: "What does renter\'s insurance cover?",
        options: ["The building structure", "Your personal belongings", "Your landlord\'s property", "Your mortgage"],
        correctAnswer: 1,
        explanation: "Renter\'s insurance covers your belongings and personal liability."
      }
    ]
  },

  'real-estate-vs-rent': {
    id: 'real-estate-vs-rent',
    title: 'Renting vs. Buying Real Estate: Pros and Cons',
    category: 'Real Estate',
    difficulty: 'Intermediate',
    points: 25,
    estimatedTime: '20 min',
    completed: false,
    content: `
      <h2>Renting vs. Buying</h2>
      
      <p>Buying builds equity, while renting offers flexibility. The right choice depends on your lifestyle, finances, and goals.</p>

      <h3>Pros of Buying</h3>
      <ul>
        <li>Asset appreciation</li>
        <li>Stable housing costs</li>
      </ul>

      <h3>Pros of Renting</h3>
      <ul>
        <li>Lower upfront costs</li>
        <li>Flexibility</li>
      </ul>
    `,
    quiz: [
      {
        id: 1,
        question: "Which is a major benefit of renting?",
        options: ["Equity growth", "Tax benefits", "Flexibility", "Property appreciation"],
        correctAnswer: 2,
        explanation: "Renting allows for easier relocation and lower upfront costs."
      }
    ]
  },

  'intro-to-hsas': {
    id: 'intro-to-hsas',
    title: 'Introduction to Health Savings Accounts (HSAs)',
    category: 'Insurance',
    difficulty: 'Intermediate',
    points: 20,
    estimatedTime: '15 min',
    completed: false,
    content: `
      <h2>What is an HSA?</h2>
      
      <p>HSAs are tax-advantaged accounts for medical expenses, available to those with high-deductible health plans (HDHPs).</p>

      <h3>Why Use One?</h3>
      <ul>
        <li>Tax-deductible contributions</li>
        <li>Tax-free growth and withdrawals for qualified expenses</li>
        <li>Triple tax benefit</li>
      </ul>
    `,
    quiz: [
      {
        id: 1,
        question: "Who is eligible for an HSA?",
        options: ["Anyone with any health plan", "Those with employer insurance only", "People with HDHPs", "Retirees over 65"],
        correctAnswer: 2,
        explanation: "HSAs are available only to individuals with high-deductible health plans."
      }
    ]
  }
};

// Helper function to get lessons by category
export const getLessonsByCategory = (category: string): Lesson[] => {
  return Object.values(educationContent).filter(lesson => 
    lesson.category.toLowerCase() === category.toLowerCase()
  );
};

// Helper function to get all categories
export const getCategories = (): string[] => {
  const categories = Object.values(educationContent).map(lesson => lesson.category);
  return [...new Set(categories)];
};