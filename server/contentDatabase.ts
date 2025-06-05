// Comprehensive financial education content database for auto-populating modules

interface ContentTemplate {
  keywords: string[];
  content: string;
  quiz: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  }>;
}

export const contentDatabase: Record<string, ContentTemplate> = {
  // Budgeting content
  "budgeting_basics": {
    keywords: ["budget", "budgeting", "basic", "fundamentals", "money management"],
    content: `<h2>Master Your Money with Smart Budgeting</h2>
<p>A budget isn't about restricting your spending—it's about giving every dollar a purpose so you can spend confidently on what matters most to you.</p>

<h3>The Simple 50/30/20 Rule</h3>
<p>This is the easiest budgeting method for beginners:</p>
<div style="background: #f8fafc; padding: 1.5rem; border-radius: 12px; margin: 1rem 0;">
  <ul style="list-style: none; padding: 0;">
    <li style="margin-bottom: 1rem; display: flex; align-items: center;">
      <div style="width: 40px; height: 40px; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; margin-right: 1rem;">50%</div>
      <div><strong>Needs</strong> - Rent, groceries, utilities, minimum debt payments</div>
    </li>
    <li style="margin-bottom: 1rem; display: flex; align-items: center;">
      <div style="width: 40px; height: 40px; background: #f59e0b; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; margin-right: 1rem;">30%</div>
      <div><strong>Wants</strong> - Dining out, entertainment, hobbies, shopping</div>
    </li>
    <li style="display: flex; align-items: center;">
      <div style="width: 40px; height: 40px; background: #3b82f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; margin-right: 1rem;">20%</div>
      <div><strong>Savings & Debt</strong> - Emergency fund, investments, extra debt payments</div>
    </li>
  </ul>
</div>

<h3>Step-by-Step Budget Creation</h3>
<ol>
  <li><strong>Calculate your after-tax income</strong> - Use your actual take-home pay</li>
  <li><strong>List all your fixed expenses</strong> - Rent, insurance, loan payments</li>
  <li><strong>Track variable expenses</strong> - Food, gas, entertainment for one month</li>
  <li><strong>Apply the 50/30/20 rule</strong> - Adjust percentages based on your situation</li>
  <li><strong>Use budgeting tools</strong> - Apps like Mint, YNAB, or simple spreadsheets</li>
</ol>

<div style="background: #ecfdf5; padding: 1rem; border-radius: 8px; margin: 1rem 0; border-left: 4px solid #10b981;">
  <strong>💡 Pro Tip:</strong> Start by tracking your spending for just one week. You'll be surprised what you discover about your money habits!
</div>`,
    quiz: [
      {
        question: "In the 50/30/20 budgeting rule, what does the 50% represent?",
        options: ["Wants and entertainment", "Savings and investments", "Needs like rent and groceries", "Emergency fund only"],
        correctAnswer: 2,
        explanation: "The 50% portion covers essential needs like housing, food, utilities, and minimum debt payments—expenses you can't easily avoid."
      },
      {
        question: "What's the first step in creating a budget?",
        options: ["Cut all unnecessary expenses", "Calculate your after-tax income", "Open a savings account", "Download a budgeting app"],
        correctAnswer: 1,
        explanation: "You need to know exactly how much money you have coming in (after taxes) before you can allocate it effectively across different categories."
      },
      {
        question: "What's a common budgeting mistake beginners make?",
        options: ["Saving too much money", "Being too restrictive with spending", "Tracking expenses too carefully", "Setting realistic goals"],
        correctAnswer: 1,
        explanation: "Being overly restrictive can lead to budget burnout. It's important to allow some flexibility for enjoyment and unexpected expenses."
      }
    ]
  },

  "zero_based_budgeting": {
    keywords: ["zero", "based", "envelope", "method"],
    content: `<h2>Zero-Based Budgeting: Every Dollar Has a Job</h2>
<p>Zero-based budgeting means your income minus your expenses equals zero. Every dollar you earn gets assigned a specific purpose before you spend it.</p>

<h3>How Zero-Based Budgeting Works</h3>
<p>The goal is to allocate every dollar of your income to specific categories until you reach zero remaining:</p>
<div style="background: #f0f9ff; padding: 1.5rem; border-radius: 12px; margin: 1rem 0;">
  <p><strong>Income: $4,000</strong></p>
  <ul>
    <li>Housing: $1,200</li>
    <li>Food: $400</li>
    <li>Transportation: $300</li>
    <li>Utilities: $200</li>
    <li>Emergency Fund: $300</li>
    <li>Retirement: $400</li>
    <li>Entertainment: $200</li>
    <li><strong>Total Allocated: $4,000</strong></li>
    <li><strong>Remaining: $0</strong></li>
  </ul>
</div>

<h3>Benefits of Zero-Based Budgeting</h3>
<ul>
  <li><strong>Complete control:</strong> You know exactly where every dollar goes</li>
  <li><strong>Prevents overspending:</strong> No money is left unassigned</li>
  <li><strong>Forces prioritization:</strong> You must decide what's most important</li>
  <li><strong>Builds discipline:</strong> Creates intentional spending habits</li>
</ul>

<h3>Getting Started</h3>
<ol>
  <li><strong>List your monthly income</strong> - All sources after taxes</li>
  <li><strong>Write down all expenses</strong> - Fixed and variable</li>
  <li><strong>Assign every dollar</strong> - Include savings and debt payments</li>
  <li><strong>Adjust as needed</strong> - Make sure you reach exactly zero</li>
  <li><strong>Track throughout the month</strong> - Stay accountable to your plan</li>
</ol>

<div style="background: #fef3c7; padding: 1rem; border-radius: 8px; margin: 1rem 0; border-left: 4px solid #f59e0b;">
  <strong>⚠️ Important:</strong> If you have money left over, assign it to a category. If you're short, reduce spending in non-essential areas.
</div>`,
    quiz: [
      {
        question: "What does it mean when your budget 'equals zero' in zero-based budgeting?",
        options: ["You have no money left", "Every dollar is assigned to a category", "You spend all your money", "You have zero savings"],
        correctAnswer: 1,
        explanation: "Zero-based budgeting means every dollar of income is allocated to specific categories (including savings), leaving zero unassigned dollars."
      },
      {
        question: "What should you do if you have money left over after assigning all expenses?",
        options: ["Keep it unassigned for flexibility", "Assign it to a specific category", "Spend it on wants", "Ignore it"],
        correctAnswer: 1,
        explanation: "Any leftover money should be assigned to a category like savings, debt payment, or future expenses to maintain the zero-based approach."
      },
      {
        question: "What's a key benefit of zero-based budgeting?",
        options: ["It's the easiest budgeting method", "It prevents overspending", "It requires no planning", "It works without tracking"],
        correctAnswer: 1,
        explanation: "Zero-based budgeting prevents overspending because every dollar has a predetermined purpose, making it impossible to accidentally overspend."
      }
    ]
  },

  "emergency_fund": {
    keywords: ["emergency", "fund", "savings", "safety", "net"],
    content: `<h2>Building Your Financial Safety Net</h2>
<p>An emergency fund is money you set aside specifically for unexpected expenses or financial emergencies. Think of it as your financial safety net that protects you from going into debt when life throws curveballs.</p>

<h3>Why You Need an Emergency Fund</h3>
<ul>
  <li><strong>Unexpected expenses:</strong> Car repairs, medical bills, or home maintenance</li>
  <li><strong>Job loss:</strong> Provides income replacement while you find new work</li>
  <li><strong>Peace of mind:</strong> Reduces stress and anxiety about money</li>
  <li><strong>Avoid debt:</strong> Prevents you from relying on credit cards or loans</li>
</ul>

<h3>How Much Should You Save?</h3>
<p>Financial experts recommend saving 3-6 months' worth of living expenses, but start small:</p>
<ol>
  <li><strong>Starter goal:</strong> $500-$1,000 for small emergencies</li>
  <li><strong>Intermediate goal:</strong> 1 month of expenses</li>
  <li><strong>Full goal:</strong> 3-6 months of expenses</li>
</ol>

<h3>Where to Keep Your Emergency Fund</h3>
<p>Your emergency fund should be easily accessible but separate from your daily spending money:</p>
<ul>
  <li><strong>High-yield savings account</strong> - Best option for most people</li>
  <li><strong>Money market account</strong> - Higher interest, limited transactions</li>
  <li><strong>Short-term CD</strong> - Only if you have multiple emergency funds</li>
</ul>

<div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; margin: 1rem 0; border-left: 4px solid #3b82f6;">
  <strong>💡 Pro Tip:</strong> Set up automatic transfers to build your emergency fund gradually. Even $25 per week adds up to $1,300 per year!
</div>`,
    quiz: [
      {
        question: "What is the primary purpose of an emergency fund?",
        options: ["To invest in the stock market", "To cover unexpected expenses and financial emergencies", "To buy luxury items", "To pay for vacation expenses"],
        correctAnswer: 1,
        explanation: "An emergency fund is specifically designed to cover unexpected expenses like medical bills, car repairs, or job loss, providing financial security when you need it most."
      },
      {
        question: "How much should you ideally have in your emergency fund?",
        options: ["1 week of expenses", "1 month of expenses", "3-6 months of expenses", "1 year of expenses"],
        correctAnswer: 2,
        explanation: "Most financial experts recommend 3-6 months of living expenses, though you can start with smaller goals like $500-$1,000."
      },
      {
        question: "Where is the best place to keep your emergency fund?",
        options: ["Under your mattress", "In your checking account with daily expenses", "In a high-yield savings account", "Invested in stocks"],
        correctAnswer: 2,
        explanation: "A high-yield savings account provides easy access while keeping the money separate from daily spending and earning interest."
      }
    ]
  },

  "investment_basics": {
    keywords: ["investment", "investing", "stocks", "bonds", "portfolio"],
    content: `<h2>Your First Steps Into Investing</h2>
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
      <strong>Starting at 25:</strong><br>
      $100/month for 40 years<br>
      Total invested: $48,000<br>
      <span style="color: #10b981; font-size: 1.2em; font-weight: bold;">Final value: $525,000</span>
    </div>
    <div style="flex: 1; background: white; padding: 1rem; border-radius: 8px;">
      <strong>Starting at 35:</strong><br>
      $100/month for 30 years<br>
      Total invested: $36,000<br>
      <span style="color: #f59e0b; font-size: 1.2em; font-weight: bold;">Final value: $249,000</span>
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
      <li>Withdraw contributions penalty-free</li>
      <li>Tax-free growth and withdrawals in retirement</li>
    </ul>
  </li>
</ol>`,
    quiz: [
      {
        question: "What is compound interest?",
        options: ["Interest paid only on the original investment", "Interest earned on both the original investment and previously earned interest", "A type of bank account", "A government savings program"],
        correctAnswer: 1,
        explanation: "Compound interest means you earn interest not just on your original investment, but also on the interest you've already earned, creating exponential growth over time."
      },
      {
        question: "Why is starting to invest early important?",
        options: ["You need more money when you're young", "Compound interest has more time to work", "Investment options are better for young people", "It's required by law"],
        correctAnswer: 1,
        explanation: "Starting early gives compound interest more time to work its magic, potentially turning small regular investments into substantial wealth over decades."
      },
      {
        question: "What should be your first investment priority if your employer offers it?",
        options: ["Individual stocks", "401(k) with employer match", "Real estate", "Cryptocurrency"],
        correctAnswer: 1,
        explanation: "A 401(k) with employer matching is essentially free money from your employer, making it the highest priority investment for most people."
      }
    ]
  },

  "credit_basics": {
    keywords: ["credit", "score", "report", "cards", "debt"],
    content: `<h2>Understanding Credit: Your Financial Report Card</h2>
<p>Credit is your ability to borrow money with the promise to pay it back. Your credit history determines your access to loans, interest rates, and even some job opportunities.</p>

<h3>What Is a Credit Score?</h3>
<p>A credit score is a three-digit number (300-850) that represents your creditworthiness. Higher scores mean better terms on loans and credit cards.</p>

<div style="background: #f8fafc; padding: 1.5rem; border-radius: 12px; margin: 1rem 0;">
  <h4>Credit Score Ranges:</h4>
  <ul style="list-style: none; padding: 0;">
    <li style="margin-bottom: 0.5rem;"><span style="color: #dc2626; font-weight: bold;">300-579:</span> Poor</li>
    <li style="margin-bottom: 0.5rem;"><span style="color: #ea580c; font-weight: bold;">580-669:</span> Fair</li>
    <li style="margin-bottom: 0.5rem;"><span style="color: #ca8a04; font-weight: bold;">670-739:</span> Good</li>
    <li style="margin-bottom: 0.5rem;"><span style="color: #16a34a; font-weight: bold;">740-799:</span> Very Good</li>
    <li><span style="color: #059669; font-weight: bold;">800-850:</span> Excellent</li>
  </ul>
</div>

<h3>What Affects Your Credit Score?</h3>
<ol>
  <li><strong>Payment History (35%)</strong> - Making payments on time</li>
  <li><strong>Credit Utilization (30%)</strong> - How much credit you use vs. available</li>
  <li><strong>Length of Credit History (15%)</strong> - How long you've had credit</li>
  <li><strong>Credit Mix (10%)</strong> - Different types of credit accounts</li>
  <li><strong>New Credit (10%)</strong> - Recent credit inquiries and new accounts</li>
</ol>

<h3>Building Good Credit</h3>
<ul>
  <li><strong>Pay on time, every time</strong> - Set up automatic payments</li>
  <li><strong>Keep balances low</strong> - Use less than 30% of available credit</li>
  <li><strong>Keep old accounts open</strong> - Longer credit history is better</li>
  <li><strong>Monitor your credit report</strong> - Check for errors regularly</li>
</ul>

<div style="background: #fef3c7; padding: 1rem; border-radius: 8px; margin: 1rem 0; border-left: 4px solid #f59e0b;">
  <strong>⚠️ Warning:</strong> Avoid closing your oldest credit card, as it can hurt your credit score by reducing your average account age.
</div>`,
    quiz: [
      {
        question: "What factor has the biggest impact on your credit score?",
        options: ["Credit utilization", "Payment history", "Length of credit history", "Credit mix"],
        correctAnswer: 1,
        explanation: "Payment history accounts for 35% of your credit score, making it the most important factor. Paying bills on time consistently is crucial for good credit."
      },
      {
        question: "What is a good credit utilization ratio?",
        options: ["Under 10%", "Under 30%", "Under 50%", "Under 70%"],
        correctAnswer: 1,
        explanation: "Keeping your credit utilization under 30% is recommended, though under 10% is even better for your credit score."
      },
      {
        question: "What credit score range is considered 'Good'?",
        options: ["580-669", "670-739", "740-799", "800-850"],
        correctAnswer: 1,
        explanation: "A credit score between 670-739 is considered 'Good' and will qualify you for most loans with decent interest rates."
      }
    ]
  },

  "dollar_cost_averaging": {
    keywords: ["dollar", "cost", "averaging", "DCA", "investment", "strategy"],
    content: `<h2>Dollar Cost Averaging: Steady Investing for Long-Term Success</h2>
<p>Dollar Cost Averaging (DCA) is an investment strategy where you invest a fixed amount of money at regular intervals, regardless of market conditions. This approach helps reduce the impact of market volatility on your investments.</p>

<h3>How Dollar Cost Averaging Works</h3>
<div style="background: #f0f9ff; padding: 1.5rem; border-radius: 12px; margin: 1rem 0;">
  <h4 style="color: #1d4ed8; margin-top: 0;">Example: Investing $100 Monthly</h4>
  <table style="width: 100%; border-collapse: collapse; margin-top: 1rem;">
    <tr style="background: #dbeafe;">
      <th style="padding: 0.5rem; border: 1px solid #93c5fd;">Month</th>
      <th style="padding: 0.5rem; border: 1px solid #93c5fd;">Investment</th>
      <th style="padding: 0.5rem; border: 1px solid #93c5fd;">Share Price</th>
      <th style="padding: 0.5rem; border: 1px solid #93c5fd;">Shares Bought</th>
    </tr>
    <tr>
      <td style="padding: 0.5rem; border: 1px solid #93c5fd; text-align: center;">Jan</td>
      <td style="padding: 0.5rem; border: 1px solid #93c5fd; text-align: center;">$100</td>
      <td style="padding: 0.5rem; border: 1px solid #93c5fd; text-align: center;">$20</td>
      <td style="padding: 0.5rem; border: 1px solid #93c5fd; text-align: center;">5.0</td>
    </tr>
    <tr>
      <td style="padding: 0.5rem; border: 1px solid #93c5fd; text-align: center;">Feb</td>
      <td style="padding: 0.5rem; border: 1px solid #93c5fd; text-align: center;">$100</td>
      <td style="padding: 0.5rem; border: 1px solid #93c5fd; text-align: center;">$25</td>
      <td style="padding: 0.5rem; border: 1px solid #93c5fd; text-align: center;">4.0</td>
    </tr>
    <tr>
      <td style="padding: 0.5rem; border: 1px solid #93c5fd; text-align: center;">Mar</td>
      <td style="padding: 0.5rem; border: 1px solid #93c5fd; text-align: center;">$100</td>
      <td style="padding: 0.5rem; border: 1px solid #93c5fd; text-align: center;">$15</td>
      <td style="padding: 0.5rem; border: 1px solid #93c5fd; text-align: center;">6.7</td>
    </tr>
    <tr style="background: #dbeafe; font-weight: bold;">
      <td style="padding: 0.5rem; border: 1px solid #93c5fd; text-align: center;">Total</td>
      <td style="padding: 0.5rem; border: 1px solid #93c5fd; text-align: center;">$300</td>
      <td style="padding: 0.5rem; border: 1px solid #93c5fd; text-align: center;">Avg: $19.17</td>
      <td style="padding: 0.5rem; border: 1px solid #93c5fd; text-align: center;">15.7</td>
    </tr>
  </table>
</div>

<h3>Benefits of Dollar Cost Averaging</h3>
<ul>
  <li><strong>Reduces market timing risk:</strong> You don't need to worry about finding the "perfect" time to invest</li>
  <li><strong>Smooths out volatility:</strong> Buy more shares when prices are low, fewer when prices are high</li>
  <li><strong>Builds discipline:</strong> Creates consistent investing habits</li>
  <li><strong>Reduces emotional investing:</strong> Removes fear and greed from investment decisions</li>
  <li><strong>Accessible to beginners:</strong> Easy to understand and implement</li>
</ul>

<h3>When to Use Dollar Cost Averaging</h3>
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1rem 0;">
  <div style="background: #f0fdf4; padding: 1rem; border-radius: 8px; border: 2px solid #10b981;">
    <h4 style="color: #047857; margin-top: 0;">Best For:</h4>
    <ul style="margin: 0;">
      <li>Regular monthly investments</li>
      <li>401(k) contributions</li>
      <li>Volatile markets</li>
      <li>Long-term goals (5+ years)</li>
      <li>Beginning investors</li>
    </ul>
  </div>
  <div style="background: #fef3c7; padding: 1rem; border-radius: 8px; border: 2px solid #f59e0b;">
    <h4 style="color: #92400e; margin-top: 0;">Consider Alternatives:</h4>
    <ul style="margin: 0;">
      <li>Large lump sum investing</li>
      <li>Very stable markets</li>
      <li>Short-term goals</li>
      <li>When you can time markets accurately</li>
    </ul>
  </div>
</div>

<div style="background: #ecfdf5; padding: 1rem; border-radius: 8px; margin: 1rem 0; border-left: 4px solid #10b981;">
  <strong>Pro Tip:</strong> Set up automatic investments with your broker or 401(k) to make dollar cost averaging effortless and consistent.
</div>`,
    quiz: [
      {
        question: "What is the main benefit of dollar cost averaging?",
        options: ["Guarantees profits", "Reduces the impact of market volatility", "Always beats lump sum investing", "Eliminates all investment risk"],
        correctAnswer: 1,
        explanation: "Dollar cost averaging helps reduce the impact of market volatility by spreading purchases over time, buying more shares when prices are low and fewer when prices are high."
      },
      {
        question: "In the example table, what was the average cost per share using dollar cost averaging?",
        options: ["$15.00", "$19.17", "$20.00", "$25.00"],
        correctAnswer: 1,
        explanation: "By investing $300 total and receiving 15.7 shares, the average cost per share was $19.17, which is lower than the simple average of the three prices ($20)."
      },
      {
        question: "When is dollar cost averaging most beneficial?",
        options: ["In stable, non-volatile markets", "For short-term investments", "In volatile markets over long periods", "Only during market crashes"],
        correctAnswer: 2,
        explanation: "Dollar cost averaging is most beneficial in volatile markets over long time periods, as it smooths out price fluctuations and reduces timing risk."
      }
    ]
  },

  "debt_management": {
    keywords: ["debt", "snowball", "avalanche", "payoff", "strategy"],
    content: `<h2>Smart Debt Payoff Strategies</h2>
<p>Having debt doesn't make you a failure—it makes you human. The key is having a strategic plan to eliminate it efficiently while building better financial habits.</p>

<h3>Debt Snowball vs. Debt Avalanche</h3>
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1rem 0;">
  <div style="background: #f0f9ff; padding: 1.5rem; border-radius: 12px; border: 2px solid #3b82f6;">
    <h4 style="color: #1d4ed8; margin-top: 0;">Debt Snowball</h4>
    <p><strong>Strategy:</strong> Pay minimums on all debts, put extra money toward smallest balance</p>
    <p><strong>Pros:</strong> Quick wins, psychological motivation</p>
    <p><strong>Best for:</strong> People who need motivation to stick with the plan</p>
  </div>
  <div style="background: #f0fdf4; padding: 1.5rem; border-radius: 12px; border: 2px solid #10b981;">
    <h4 style="color: #047857; margin-top: 0;">Debt Avalanche</h4>
    <p><strong>Strategy:</strong> Pay minimums on all debts, put extra money toward highest interest rate</p>
    <p><strong>Pros:</strong> Saves the most money in interest</p>
    <p><strong>Best for:</strong> People motivated by mathematical optimization</p>
  </div>
</div>

<h3>Creating Your Debt Payoff Plan</h3>
<ol>
  <li><strong>List all your debts</strong> - Balances, minimum payments, interest rates</li>
  <li><strong>Choose your strategy</strong> - Snowball or avalanche</li>
  <li><strong>Find extra money</strong> - Reduce expenses or increase income</li>
  <li><strong>Make extra payments</strong> - Apply to your target debt</li>
  <li><strong>Celebrate milestones</strong> - Acknowledge progress along the way</li>
</ol>

<h3>Avoiding Common Debt Traps</h3>
<ul>
  <li><strong>Only paying minimums</strong> - You'll pay mostly interest for years</li>
  <li><strong>Using balance transfers incorrectly</strong> - Don't rack up new debt</li>
  <li><strong>Closing accounts after payoff</strong> - Can hurt your credit score</li>
  <li><strong>Not addressing the root cause</strong> - Fix spending habits too</li>
</ul>

<div style="background: #ecfdf5; padding: 1rem; border-radius: 8px; margin: 1rem 0; border-left: 4px solid #10b981;">
  <strong>💪 Motivation:</strong> Every extra dollar you put toward debt saves you money in interest and gets you closer to financial freedom!
</div>`,
    quiz: [
      {
        question: "What's the main difference between debt snowball and debt avalanche strategies?",
        options: ["Snowball focuses on highest interest rates first", "Avalanche focuses on smallest balances first", "Snowball focuses on smallest balances first", "There is no difference"],
        correctAnswer: 2,
        explanation: "The debt snowball focuses on paying off the smallest balances first for psychological wins, while debt avalanche targets the highest interest rates first to save money."
      },
      {
        question: "Which debt payoff strategy saves the most money in interest?",
        options: ["Debt snowball", "Debt avalanche", "Both save the same amount", "Neither saves money"],
        correctAnswer: 1,
        explanation: "The debt avalanche method saves the most money in interest because you're eliminating the highest interest rate debts first."
      },
      {
        question: "What should you do with credit cards after paying them off?",
        options: ["Close them immediately", "Keep them open but don't use them", "Cut them up and throw them away", "Apply for new ones"],
        correctAnswer: 1,
        explanation: "Keeping old credit cards open (but unused) helps maintain your credit history length and available credit, which benefits your credit score."
      }
    ]
  }
};

// Function to find the best matching content for a module
export function findBestContent(title: string, description: string, category: string): ContentTemplate | null {
  const searchText = `${title} ${description} ${category}`.toLowerCase();
  
  // Direct category matching first
  const categoryKey = category.toLowerCase().replace(/\s+/g, '_');
  if (contentDatabase[categoryKey + '_basics']) {
    return contentDatabase[categoryKey + '_basics'];
  }
  
  // Keyword matching
  let bestMatch: { key: string; score: number } | null = null;
  
  for (const [key, template] of Object.entries(contentDatabase)) {
    let score = 0;
    
    // Check how many keywords match
    for (const keyword of template.keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        score += 1;
      }
    }
    
    // Bonus for exact title matches
    if (title.toLowerCase().includes(key.replace('_', ' '))) {
      score += 3;
    }
    
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { key, score };
    }
  }
  
  return bestMatch ? contentDatabase[bestMatch.key] : null;
}

// Fallback content for when no specific match is found
export const fallbackContent: ContentTemplate = {
  keywords: [],
  content: `<h2>Financial Education Content</h2>
<p>This lesson will help you develop important financial skills and knowledge to improve your money management.</p>

<h3>Key Learning Objectives</h3>
<ul>
  <li>Understand fundamental financial concepts</li>
  <li>Learn practical money management strategies</li>
  <li>Develop healthy financial habits</li>
  <li>Build confidence in financial decision-making</li>
</ul>

<h3>Getting Started</h3>
<p>Financial literacy is a journey, not a destination. Each lesson builds upon previous knowledge to create a comprehensive understanding of personal finance.</p>

<div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; margin: 1rem 0; border-left: 4px solid #3b82f6;">
  <strong>💡 Remember:</strong> The most important step in improving your finances is simply getting started. Small, consistent actions lead to big results over time.
</div>`,
  quiz: [
    {
      question: "What is the most important factor in building wealth over time?",
      options: ["Having a high income", "Starting early and being consistent", "Making risky investments", "Avoiding all debt"],
      correctAnswer: 1,
      explanation: "Consistency and time are more powerful than income level when building wealth. Starting early allows compound interest to work in your favor."
    },
    {
      question: "What's the first step in improving your financial situation?",
      options: ["Investing in stocks", "Creating a budget", "Paying off all debt", "Getting a higher-paying job"],
      correctAnswer: 1,
      explanation: "Creating a budget helps you understand where your money goes and is the foundation for all other financial improvements."
    },
    {
      question: "Why is financial education important?",
      options: ["It guarantees wealth", "It helps you make informed money decisions", "It's required by law", "It eliminates all financial risk"],
      correctAnswer: 1,
      explanation: "Financial education provides the knowledge and skills needed to make informed decisions about money, leading to better financial outcomes."
    }
  ]
};