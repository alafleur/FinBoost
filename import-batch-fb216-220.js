import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { learningModules } from './shared/schema.ts';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const client = postgres(connectionString);
const db = drizzle(client);

const modules = {
  "fb216": {
    "id": "fb216",
    "title": "House Poor: When Buying Too Much Home Becomes a Financial Trap",
    "category": "Real Estate",
    "difficulty": "Intermediate",
    "points": 20,
    "estimatedTime": 5,
    "completed": false,
    "content": "<h2>House Poor: When Buying Too Much Home Becomes a Financial Trap</h2><p>Being 'house poor' means too much of your income is tied up in housing costs—leaving little flexibility for savings, investing, or unexpected expenses. It's not just about the mortgage. Taxes, insurance, maintenance, and utilities add up—and many buyers underestimate their real monthly burden.</p><h3>Key Risks</h3><ul><li><strong>Illiquidity</strong>: Home equity isn't easily accessed cash. Accessing it requires refinancing or a home equity loan—both with costs and approval processes.</li><li><strong>Maintenance surprise</strong>: Budgets for repairs, replacements, and upkeep are often underestimated. A new roof or HVAC system can cost $10,000–$20,000+.</li><li><strong>Property taxes and insurance</strong>: These costs increase over time and vary by location. In some areas, they add 20–40% to your monthly payment.</li><li><strong>Opportunity cost</strong>: Money tied up in excess housing can't be invested in retirement accounts, emergency funds, or other priorities.</li></ul><h3>How to Avoid It</h3><ul><li><strong>Total housing budget</strong>: Include mortgage, taxes, insurance, maintenance, and utilities. Aim for 25–30% of gross income.</li><li><strong>Emergency fund first</strong>: Don't use all savings for a down payment. Keep 3–6 months of expenses available.</li><li><strong>Consider mobility</strong>: Buying ties you to a location. Renting preserves flexibility if career or life changes are likely.</li><li><strong>Factor in lifestyle goals</strong>: A house that forces you to skip vacations, delay retirement, or avoid investing may cost more than it's worth.</li></ul><p>A home is both shelter and investment—but prioritizing the investment aspect at the expense of overall financial health defeats the purpose. Buy what you can afford comfortably, not what you qualify for.</p>",
    "quiz": [
      {
        "id": "q1",
        "question": "What does being 'house poor' typically mean?",
        "options": ["Owning a depreciating home", "Spending a disproportionate share of income on housing", "Having no home insurance"],
        "correctAnswer": 1,
        "explanation": "It refers to having a home you can technically afford but at the cost of other financial priorities."
      },
      {
        "id": "q2",
        "question": "Why is home equity not a reliable emergency resource?",
        "options": ["It's not real value", "It can't be taxed", "It's illiquid—you can't access it easily without loans or a sale"],
        "correctAnswer": 2,
        "explanation": "Tapping equity often requires a refinance or home equity loan, which takes time and costs money."
      },
      {
        "id": "q3",
        "question": "What's a key risk of underestimating total housing costs?",
        "options": ["Lower credit scores", "Asset correlation", "Underfunding other goals like savings or retirement"],
        "correctAnswer": 2,
        "explanation": "Housing costs crowd out other critical areas when they consume too much of your budget."
      }
    ]
  },

  "fb217": {
    "id": "fb217",
    "title": "Auto Loans: Understanding the Real Cost of Car Financing",
    "category": "Debt",
    "difficulty": "Intermediate",
    "points": 20,
    "estimatedTime": 5,
    "completed": false,
    "content": "<h2>Auto Loans: Understanding the Real Cost of Car Financing</h2><p>Auto loans are one of the most common forms of consumer debt—but often misunderstood. A longer term may lower your monthly payment but increases total interest. High-interest loans on rapidly depreciating assets can damage long-term financial stability if not managed intentionally.</p><h3>What to Know</h3><ul><li><strong>Depreciation mismatch</strong>: Most cars lose 20–30% of value in the first year. If you finance the full amount, you'll likely owe more than the car is worth initially.</li><li><strong>Interest rate factors</strong>: Credit score, loan term, and down payment all affect your rate. Rates on auto loans are typically higher than mortgages but lower than credit cards.</li><li><strong>Total cost impact</strong>: A $25,000 car financed at 6% for 72 months costs $30,500 total vs. $27,600 over 48 months—despite the same rate.</li></ul><h3>Smart Strategies</h3><ul><li><strong>Keep terms short</strong>: 36–48 months minimizes interest while keeping payments manageable for most budgets.</li><li><strong>Make a down payment</strong>: 10–20% down reduces the loan amount and may help you avoid negative equity.</li><li><strong>Consider total transportation costs</strong>: Payment + insurance + maintenance + fuel. Aim for under 10% of take-home income.</li><li><strong>Buy used smartly</strong>: 2–3 year old cars often provide the best value—much of the depreciation is behind them.</li></ul><p>Cars are tools, not investments. The goal is reliable transportation at the lowest reasonable cost. Avoid the temptation to stretch for a nicer car if it strains your budget or delays other financial goals.</p>",
    "quiz": [
      {
        "id": "q1",
        "question": "What is negative equity in the context of auto loans?",
        "options": ["Having no co-signer", "Owning the car outright", "Owing more on the loan than the car is worth"],
        "correctAnswer": 2,
        "explanation": "Negative equity means you're underwater—your loan exceeds the car's value."
      },
      {
        "id": "q2",
        "question": "Why do longer loan terms cost more in total?",
        "options": ["They come with prepayment penalties", "They always include add-ons", "They accrue more interest over time even at the same rate"],
        "correctAnswer": 2,
        "explanation": "Spreading out payments over more months increases the total interest paid."
      },
      {
        "id": "q3",
        "question": "What's a common budgeting guideline for car payments?",
        "options": ["They should never exceed 25% of income", "They should be below 10% of take-home pay", "They should be equal to your rent"],
        "correctAnswer": 1,
        "explanation": "Keeping payments under 10% of net income helps maintain overall budget health."
      }
    ]
  },

  "fb218": {
    "id": "fb218",
    "title": "How to Evaluate a 401(k) Match",
    "category": "Retirement",
    "difficulty": "Intermediate",
    "points": 20,
    "estimatedTime": 5,
    "completed": false,
    "content": "<h2>How to Evaluate a 401(k) Match</h2><p>Employer 401(k) matches are one of the few 'free money' offers in personal finance. But how much it's worth depends on your contribution strategy and vesting schedule. Understanding how matches are structured helps you prioritize retirement savings smartly.</p><h3>What to Evaluate</h3><ul><li><strong>Common structures</strong>: e.g., 100% of first 3% of salary, or 50% of first 6%</li><li><strong>Vesting schedule</strong>: Some matches are immediate, others require you to stay 2–6 years to keep the full benefit</li><li><strong>Contribution limits</strong>: Both employee and employer contributions count toward the annual 401(k) limit ($23,000 in 2024, plus $7,500 catch-up if 50+)</li></ul><h3>Maximizing Value</h3><ul><li><strong>Contribute enough to get the full match</strong>: If your employer matches 50% of the first 6% you contribute, contribute at least 6% to get the full 3% match.</li><li><strong>Understand your vesting</strong>: If you're planning to leave soon, factor in how much of the match you'll actually keep.</li><li><strong>Consider Roth vs Traditional</strong>: Many plans offer both options. Your current vs expected future tax bracket should guide this choice.</li><li><strong>Don't over-contribute early</strong>: If you max out contributions early in the year, you might miss match on later paychecks.</li></ul><p>A 401(k) match is essentially a guaranteed return on your contribution—often 25–100%. Prioritize getting the full match before focusing on other investments, even if the plan has limited options or high fees.</p>",
    "quiz": [
      {
        "id": "q1",
        "question": "What's a typical 401(k) employer match formula?",
        "options": ["25% of any contribution", "50% of first 6% of salary", "10% bonus each year"],
        "correctAnswer": 1,
        "explanation": "Many employers offer to match 50 cents on the dollar up to a certain percent of your salary."
      },
      {
        "id": "q2",
        "question": "Why does a vesting schedule matter?",
        "options": ["It limits tax deductions", "It affects whether you keep the employer's contribution when you leave", "It changes your contribution amount"],
        "correctAnswer": 1,
        "explanation": "Vesting determines when employer contributions become yours to keep if you leave."
      },
      {
        "id": "q3",
        "question": "What happens if you contribute less than the match threshold?",
        "options": ["The employer gives you the full match anyway", "You may forfeit part of the available match", "Your account is closed"],
        "correctAnswer": 1,
        "explanation": "If you don't contribute enough, you may leave employer matching dollars on the table."
      }
    ]
  },

  "fb219": {
    "id": "fb219",
    "title": "Intro to Roth vs Traditional Accounts",
    "category": "Retirement",
    "difficulty": "Intermediate",
    "points": 20,
    "estimatedTime": 5,
    "completed": false,
    "content": "<h2>Intro to Roth vs Traditional Accounts</h2><p>Both Roth and Traditional retirement accounts offer tax advantages—but the benefits come at different times. Traditional accounts lower taxable income today, while Roth accounts provide tax-free withdrawals in retirement. The right choice depends on your current vs. expected future tax bracket and need for flexibility.</p><h3>Core Differences</h3><ul><li><strong>Traditional IRA/401(k)</strong>: Tax-deductible now; taxed on withdrawals in retirement</li><li><strong>Roth IRA/401(k)</strong>: No immediate tax benefit; tax-free growth and withdrawals</li><li><strong>Required distributions</strong>: Traditional accounts require withdrawals starting at age 73; Roth IRAs have no RMDs</li></ul><h3>Choosing Between Them</h3><ul><li><strong>Higher tax bracket now</strong>: Traditional may make sense—get the deduction while your rate is high</li><li><strong>Expect higher taxes later</strong>: Roth can protect against future rate increases</li><li><strong>Early retirement plans</strong>: Roth contributions can be withdrawn penalty-free after 5 years</li><li><strong>Income limits</strong>: High earners may be phased out of Roth IRA eligibility (but can use backdoor Roth strategies)</li></ul><h3>Flexibility Factors</h3><ul><li><strong>Roth advantages</strong>: No RMDs, tax-free growth, contributions can be withdrawn</li><li><strong>Traditional advantages</strong>: Immediate tax savings, potentially lower tax rates in retirement</li><li><strong>Diversification</strong>: Having both types provides tax flexibility in retirement</li></ul><p>Many people benefit from contributing to both types over time—Traditional during high-earning years for immediate tax relief, and Roth during lower-income periods or when expecting higher future taxes.</p>",
    "quiz": [
      {
        "id": "q1",
        "question": "Which account type offers tax-free withdrawals in retirement?",
        "options": ["Traditional IRA", "Brokerage account", "Roth IRA"],
        "correctAnswer": 2,
        "explanation": "Roth accounts grow tax-free and withdrawals are not taxed if rules are followed."
      },
      {
        "id": "q2",
        "question": "What's a reason to prefer a Traditional IRA over a Roth?",
        "options": ["If your income is tax-free", "If you expect to be in a lower tax bracket in retirement", "If you want higher fees"],
        "correctAnswer": 1,
        "explanation": "Traditional IRAs provide immediate tax savings if you expect lower taxes in the future."
      },
      {
        "id": "q3",
        "question": "Which account is subject to RMDs at age 73?",
        "options": ["Roth IRA", "Traditional 401(k)", "HSA"],
        "correctAnswer": 1,
        "explanation": "Traditional 401(k)s require minimum withdrawals starting at age 73."
      }
    ]
  },

  "fb220": {
    "id": "fb220",
    "title": "When Refinancing Makes Sense (and When It Doesn't)",
    "category": "Debt",
    "difficulty": "Intermediate",
    "points": 20,
    "estimatedTime": 5,
    "completed": false,
    "content": "<h2>When Refinancing Makes Sense (and When It Doesn't)</h2><p>Refinancing a loan—whether a mortgage, auto loan, or student loan—can lower your interest rate or change your repayment terms. But it's not always a win. Timing, fees, and your goals matter. Understand the tradeoffs before locking in new terms.</p><h3>Key Factors</h3><ul><li><strong>Rate reduction</strong>: Refinancing only makes sense if the new rate meaningfully reduces interest costs.</li><li><strong>Closing costs</strong>: Mortgages often have $2,000–$5,000 in fees. Calculate break-even time.</li><li><strong>Loan term changes</strong>: Extending the term lowers payments but increases total interest. Shortening it does the opposite.</li><li><strong>Credit improvement</strong>: If your score has improved significantly, you may qualify for better rates.</li></ul><h3>When It Makes Sense</h3><ul><li><strong>Rate drop of 0.5–1%+</strong>: Generally worth considering for mortgages, especially early in the loan term</li><li><strong>Removing PMI</strong>: If home value increased enough to eliminate private mortgage insurance</li><li><strong>Cash-out needs</strong>: Accessing equity at lower rates than other debt options</li><li><strong>Switch loan types</strong>: ARM to fixed, or vice versa based on rate environment</li></ul><h3>When to Be Cautious</h3><ul><li><strong>Late in loan term</strong>: You've already paid most interest; savings may be minimal</li><li><strong>High closing costs</strong>: Break-even period too long relative to how long you'll keep the loan</li><li><strong>Federal student loans</strong>: You lose forgiveness options, income-driven plans, and other protections</li><li><strong>Rate shopping fatigue</strong>: Multiple applications can hurt your credit if not done within 14–45 days</li></ul><p>The key is calculating total cost over the time you'll actually keep the loan. A lower rate doesn't automatically mean savings if fees, terms, or lost benefits offset the gains.</p>",
    "quiz": [
      {
        "id": "q1",
        "question": "What does refinancing mean?",
        "options": ["Selling your loan to someone else", "Paying your loan off early", "Replacing an old loan with a new one, often at better terms"],
        "correctAnswer": 2,
        "explanation": "It's taking out a new loan to pay off an existing one—ideally to save money or improve terms."
      },
      {
        "id": "q2",
        "question": "What is a key risk of refinancing federal student loans into private ones?",
        "options": ["Higher credit score requirement", "Loss of federal benefits like forgiveness or income-based repayment", "It doubles your payment"],
        "correctAnswer": 1,
        "explanation": "You give up federal protections like deferment, forbearance, and forgiveness programs."
      },
      {
        "id": "q3",
        "question": "Why might a lower monthly payment not actually save you money?",
        "options": ["It triggers a tax penalty", "It usually comes with higher interest rates", "It can extend your loan term, increasing total interest paid"],
        "correctAnswer": 2,
        "explanation": "Extending repayment spreads out interest over more time—even if the rate is lower."
      }
    ]
  }
};

async function importModules() {
  try {
    console.log('Starting import of FB216-220 learning modules...');
    
    for (const [moduleId, moduleData] of Object.entries(modules)) {
      console.log(`\nImporting module ${moduleId}: ${moduleData.title}`);
      
      const insertData = {
        title: moduleData.title,
        description: `Learn about ${moduleData.title.toLowerCase()} and test your knowledge with interactive questions.`,
        content: moduleData.content,
        category: moduleData.category,
        difficulty: moduleData.difficulty,
        estimated_minutes: moduleData.estimatedTime,
        points: moduleData.points,
        quiz: JSON.stringify(moduleData.quiz),
        published: false,
        order: 0
      };
      
      const result = await db.insert(learningModules).values(insertData).returning();
      
      console.log(`✅ Module ${moduleId} imported successfully with ID: ${result[0].id}`);
    }
    
    console.log('\n🎉 All FB216-220 modules imported successfully!');
    console.log('Modules added:');
    console.log('- FB216: House Poor (Real Estate)');
    console.log('- FB217: Auto Loans (Debt)'); 
    console.log('- FB218: 401(k) Match (Retirement)');
    console.log('- FB219: Roth vs Traditional (Retirement)');
    console.log('- FB220: Refinancing (Debt)');
    
  } catch (error) {
    console.error('Error importing modules:', error);
  } finally {
    await client.end();
  }
}

importModules();