import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const sql = postgres(connectionString);
const db = drizzle(sql);

const modules = {
  "fb211": {
    "id": "fb211",
    "title": "The Hidden Cost of Investment Fees",
    "category": "Investing",
    "difficulty": "Intermediate",
    "points": 20,
    "estimatedTime": 5,
    "completed": false,
    "content": "<h2>The Hidden Cost of Investment Fees</h2><p>Fees might seem small—just 1% annually—but over decades, they compound against you. Whether it's fund expense ratios or advisor fees, even modest percentages can erode your total return. It's not just about minimizing fees blindly, but understanding what you're paying for—and what value you're getting in return.</p><h3>Fee Types and Impacts</h3><ul><li><strong>Expense ratios</strong>: Charged by mutual funds and ETFs annually. Even 0.5% vs. 1.5% makes a significant difference over 30 years.</li><li><strong>Load fees</strong>: Upfront or backend charges that reduce your initial investment or final return.</li><li><strong>Advisory fees</strong>: Typically 1% annually for professional management. May be worth it for comprehensive planning.</li><li><strong>Trading costs</strong>: Bid-ask spreads and commissions that eat into frequent trading strategies.</li></ul><h3>The Compounding Effect</h3><p>A $10,000 investment growing at 7% annually becomes $76,123 in 30 years. With a 1% annual fee, that same investment only grows to $57,435—a loss of nearly $19,000 to fees alone. The fee doesn't just reduce your return by 1%; it reduces your wealth by 25%.</p><h3>When Fees May Be Justified</h3><ul><li><strong>Active management</strong>: If a fund consistently outperforms after fees (rare but possible).</li><li><strong>Advisor value</strong>: Tax planning, estate planning, behavioral coaching may justify advisory fees.</li><li><strong>Specialized exposure</strong>: Hard-to-access markets or strategies may warrant higher costs.</li></ul><h3>Strategies to Minimize Fee Impact</h3><ul><li>Favor low-cost index funds and ETFs for core holdings</li><li>Use tax-advantaged accounts to shelter growth from taxes</li><li>Consider fee-only advisors who charge transparent hourly or project rates</li><li>Review and compare expense ratios before investing</li><li>Avoid frequent trading unless you have a clear edge</li></ul>",
    "quiz": [
      {
        "id": "q1",
        "question": "What's the main long-term risk of seemingly small investment fees?",
        "options": ["Regulatory scrutiny", "They compound and significantly reduce total returns", "They cause immediate portfolio losses"],
        "correctAnswer": 1,
        "explanation": "Fees reduce compounding over time, which can meaningfully drag down your portfolio."
      },
      {
        "id": "q2",
        "question": "Which of the following typically has the lowest expense ratio?",
        "options": ["Actively managed mutual fund", "Target-date fund", "Broad-market index ETF"],
        "correctAnswer": 2,
        "explanation": "Index ETFs often have very low costs due to passive management."
      },
      {
        "id": "q3",
        "question": "When might paying a 1% advisor fee be reasonable?",
        "options": ["Never", "Only if returns are guaranteed", "If it includes personalized planning and long-term value"],
        "correctAnswer": 2,
        "explanation": "Fees may be justified if paired with meaningful value, such as tax or estate planning."
      }
    ]
  },

  "fb212": {
    "id": "fb212",
    "title": "Understanding Opportunity Cost in Financial Decisions",
    "category": "Planning",
    "difficulty": "Intermediate",
    "points": 20,
    "estimatedTime": 5,
    "completed": false,
    "content": "<h2>Understanding Opportunity Cost in Financial Decisions</h2><p>Every choice has a cost—even if it's not visible. Opportunity cost is what you give up by choosing one option over another. In finance, this applies to saving vs. investing, paying down debt vs. building reserves, or renting vs. buying. Calculating it forces you to think beyond surface-level comparisons.</p><h3>Applications</h3><ul><li>Leaving cash idle means forgoing potential investment returns</li><li>Paying down low-interest debt may cost you higher investment returns</li><li>Buying a house ties up capital that could be invested elsewhere</li><li>Taking a lower-paying but stable job costs potential higher earnings</li></ul><h3>How to Calculate</h3><p>Opportunity cost = Return of the best alternative - Return of chosen option</p><p>Example: You choose a savings account earning 2% instead of investing in stocks averaging 8%. Your opportunity cost is 6% annually (8% - 2%).</p><h3>Common Scenarios</h3><ul><li><strong>Emergency fund size</strong>: Holding 12 months of expenses vs. 6 months and investing the difference</li><li><strong>Debt payoff strategy</strong>: Aggressive payoff vs. minimum payments with investing</li><li><strong>Major purchases</strong>: Buying vs. renting, new vs. used, luxury vs. necessity</li><li><strong>Career decisions</strong>: Immediate income vs. education/training for future earnings</li></ul><h3>When to Accept Higher Opportunity Costs</h3><ul><li>Need for liquidity or emergency access</li><li>Risk tolerance requires more conservative choices</li><li>Non-financial benefits (peace of mind, lifestyle preferences)</li><li>Tax advantages that offset lower gross returns</li></ul>",
    "quiz": [
      {
        "id": "q1",
        "question": "What does opportunity cost represent?",
        "options": ["The tax owed on gains", "The price of delaying a purchase", "The value of the next best alternative foregone"],
        "correctAnswer": 2,
        "explanation": "It's what you give up when choosing one option over another."
      },
      {
        "id": "q2",
        "question": "If you leave $10,000 in cash earning 0% instead of investing at 5%, what's the one-year opportunity cost?",
        "options": ["$500", "$50", "$5"],
        "correctAnswer": 0,
        "explanation": "The missed return is 5% of $10,000 = $500."
      },
      {
        "id": "q3",
        "question": "Which of the following may justify accepting a lower-return option?",
        "options": ["Liquidity needs", "Social pressure", "Low credit score"],
        "correctAnswer": 0,
        "explanation": "If you need quick access to funds, lower-return, liquid options may be appropriate."
      }
    ]
  },

  "fb213": {
    "id": "fb213",
    "title": "Why Diversification Works (and When It Doesn't)",
    "category": "Investing",
    "difficulty": "Intermediate",
    "points": 20,
    "estimatedTime": 5,
    "completed": false,
    "content": "<h2>Why Diversification Works (and When It Doesn't)</h2><p>Diversification reduces portfolio risk by spreading investments across assets that behave differently. The idea is simple: don't put all your eggs in one basket. But diversification isn't magic—it only works when asset classes aren't highly correlated.</p><h3>Key Concepts</h3><ul><li><strong>Correlation</strong>: If assets move together, diversification provides less benefit.</li><li><strong>Diversifiable risk</strong>: Company-specific risks that can be eliminated through diversification.</li><li><strong>Systematic risk</strong>: Market-wide risks that affect all assets and can't be diversified away.</li></ul><h3>Types of Diversification</h3><ul><li><strong>Asset class</strong>: Stocks, bonds, real estate, commodities</li><li><strong>Geographic</strong>: Domestic vs. international markets</li><li><strong>Sector</strong>: Technology, healthcare, finance, etc.</li><li><strong>Market cap</strong>: Large, mid, small-cap stocks</li><li><strong>Time</strong>: Dollar-cost averaging spreads purchase timing</li></ul><h3>When Diversification Fails</h3><ul><li><strong>Crisis periods</strong>: Correlations spike, everything falls together</li><li><strong>Over-diversification</strong>: Too many holdings dilute potential gains</li><li><strong>False diversification</strong>: Owning similar assets that you think are different</li><li><strong>Home bias</strong>: Over-concentrating in your domestic market</li></ul><h3>Building Effective Diversification</h3><ul><li>Use broad market index funds as core holdings</li><li>Add international exposure (developed and emerging markets)</li><li>Include bonds or other defensive assets</li><li>Consider alternative investments (REITs, commodities) in small amounts</li><li>Rebalance periodically to maintain target allocations</li></ul>",
    "quiz": [
      {
        "id": "q1",
        "question": "What's a key requirement for diversification to reduce risk?",
        "options": ["Owning more than 20 stocks", "Assets that move independently", "Investing only in U.S. tech companies"],
        "correctAnswer": 1,
        "explanation": "Diversification is effective when asset returns aren't tightly correlated."
      },
      {
        "id": "q2",
        "question": "Why can diversification be less effective during a market crisis?",
        "options": ["Markets stop trading", "All assets tend to move in the same direction", "Cash becomes worthless"],
        "correctAnswer": 1,
        "explanation": "Correlations spike during crises, reducing diversification benefits."
      },
      {
        "id": "q3",
        "question": "Which of the following adds more meaningful diversification?",
        "options": ["Owning 50 large-cap U.S. stocks", "Adding global bonds or commodities", "Holding all your money in one fund"],
        "correctAnswer": 1,
        "explanation": "Different asset classes behave differently—true diversification spans them."
      }
    ]
  },

  "fb214": {
    "id": "fb214",
    "title": "The Tax Impact of Selling Investments",
    "category": "Taxes",
    "difficulty": "Advanced",
    "points": 20,
    "estimatedTime": 5,
    "completed": false,
    "content": "<h2>The Tax Impact of Selling Investments</h2><p>When you sell an investment for more than you paid, you trigger a capital gain. If held over a year, it's taxed at long-term rates (0%–20%). Sell earlier, and it's taxed as ordinary income. Timing sales and understanding tax lots (FIFO, specific ID) can meaningfully impact what you keep vs. what you owe.</p><h3>Tax Considerations</h3><ul><li><strong>Short-term vs. long-term</strong>: Holding period affects tax treatment significantly</li><li><strong>Tax-loss harvesting</strong>: Selling losers to offset gains</li><li><strong>Wash sale rule</strong>: Can't claim losses if you rebuy within 30 days</li><li><strong>Tax lot selection</strong>: Choose which shares to sell for optimal tax impact</li></ul><h3>Capital Gains Tax Rates (2024)</h3><ul><li><strong>Long-term (>1 year)</strong>: 0%, 15%, or 20% based on income</li><li><strong>Short-term (≤1 year)</strong>: Taxed as ordinary income (up to 37%)</li><li><strong>Net investment income tax</strong>: Additional 3.8% for high earners</li></ul><h3>Strategies for Tax Efficiency</h3><ul><li><strong>Hold for long-term rates</strong>: Wait over a year when possible</li><li><strong>Harvest losses</strong>: Sell losers to offset gains, mind wash sale rule</li><li><strong>Asset location</strong>: Hold tax-inefficient investments in tax-advantaged accounts</li><li><strong>Specific identification</strong>: Choose which tax lots to sell</li><li><strong>Donate appreciated assets</strong>: Avoid capital gains while getting deduction</li></ul><h3>Tax-Advantaged Account Benefits</h3><ul><li><strong>401(k)/IRA</strong>: No capital gains taxes on trades within the account</li><li><strong>Roth accounts</strong>: Tax-free growth and withdrawals in retirement</li><li><strong>HSA</strong>: Triple tax advantage for medical expenses</li></ul>",
    "quiz": [
      {
        "id": "q1",
        "question": "What's the tax advantage of holding an investment for over one year?",
        "options": ["You avoid capital gains taxes", "It qualifies for lower long-term capital gains rates", "Dividends become tax-free"],
        "correctAnswer": 1,
        "explanation": "Long-term gains are taxed at lower preferential rates than short-term gains."
      },
      {
        "id": "q2",
        "question": "What is the 'wash sale rule' designed to prevent?",
        "options": ["Buying too many ETFs", "Claiming a tax loss while retaining economic exposure", "Avoiding taxes through donations"],
        "correctAnswer": 1,
        "explanation": "The rule disallows loss deductions if you buy the same or similar security within 30 days."
      },
      {
        "id": "q3",
        "question": "What does 'specific identification' allow you to do?",
        "options": ["Avoid all capital gains", "Pick which tax lot to sell for gain/loss optimization", "Defer capital gains indefinitely"],
        "correctAnswer": 1,
        "explanation": "It lets you choose which shares (by purchase date/price) to sell for optimal tax impact."
      }
    ]
  },

  "fb215": {
    "id": "fb215",
    "title": "Understanding Sinking Costs and When to Walk Away",
    "category": "Planning",
    "difficulty": "Intermediate",
    "points": 20,
    "estimatedTime": 5,
    "completed": false,
    "content": "<h2>Understanding Sinking Costs and When to Walk Away</h2><p>The sunk cost fallacy is when you continue investing time or money into something just because you already have. But sunk costs are unrecoverable—what matters is future value. This applies to investments, careers, purchases, or even relationships. Rational decisions focus on marginal benefit moving forward.</p><h3>Common Traps</h3><ul><li>Holding a stock that's down 60% because you \"already lost too much\"</li><li>Continuing a failing business because of money already invested</li><li>Staying in a career because of years already spent</li><li>Finishing a degree program that no longer serves your goals</li></ul><h3>Examples in Personal Finance</h3><ul><li><strong>Investment losses</strong>: Refusing to sell a declining stock to \"break even\"</li><li><strong>Home ownership</strong>: Staying in an oversized house due to money spent on renovations</li><li><strong>Subscriptions</strong>: Keeping unused services because you \"already paid\"</li><li><strong>Career changes</strong>: Avoiding new opportunities due to current investments in training</li></ul><h3>How to Overcome Sunk Cost Bias</h3><ul><li><strong>Focus on future value</strong>: What will this decision yield going forward?</li><li><strong>Set clear criteria</strong>: Define success/failure metrics in advance</li><li><strong>Regular reviews</strong>: Periodically reassess all major commitments</li><li><strong>Seek outside perspective</strong>: Others can see bias more clearly</li><li><strong>Practice small decisions</strong>: Build rational decision-making habits</li></ul><h3>When to Walk Away</h3><ul><li>Opportunity cost exceeds potential benefits</li><li>Circumstances have fundamentally changed</li><li>You're throwing good money after bad</li><li>Continuing conflicts with your current goals</li></ul>",
    "quiz": [
      {
        "id": "q1",
        "question": "What defines a sunk cost?",
        "options": ["Any money spent this year", "Money or time already spent and unrecoverable", "Future expenses that will be due soon"],
        "correctAnswer": 1,
        "explanation": "Sunk costs are past investments that can't be recovered and shouldn't affect future choices."
      },
      {
        "id": "q2",
        "question": "What question can help you avoid sunk cost bias?",
        "options": ["What's the breakeven point?", "Would I choose this again today?", "How much have I spent already?"],
        "correctAnswer": 1,
        "explanation": "Future-focused decision making helps you avoid being anchored to past costs."
      },
      {
        "id": "q3",
        "question": "Why is the sunk cost fallacy financially harmful?",
        "options": ["It forces immediate action", "It prevents rebalancing", "It keeps people in suboptimal decisions due to past investments"],
        "correctAnswer": 2,
        "explanation": "It leads to poor decisions by irrationally valuing past spending over future benefit."
      }
    ]
  }
};

async function importModules() {
  try {
    console.log('Starting import of 5 new modules (FB211-215)...');
    
    for (const [moduleId, moduleData] of Object.entries(modules)) {
      console.log(`\nImporting module ${moduleId}: ${moduleData.title}`);
      
      // Insert the learning module
      const insertResult = await sql`
        INSERT INTO learning_modules (
          title, description, content, category, difficulty, points_reward, estimated_minutes, is_published
        ) VALUES (
          ${moduleData.title},
          ${moduleData.description || `Learn about ${moduleData.title.toLowerCase()} and improve your financial knowledge.`},
          ${moduleData.content},
          ${moduleData.category},
          ${moduleData.difficulty},
          ${moduleData.points},
          ${moduleData.estimatedTime},
          false
        ) RETURNING id, title
      `;
      
      const newModuleId = insertResult[0].id;
      console.log(`✅ Module inserted with ID: ${newModuleId}`);
      
      // Update module with quiz data as JSON
      const quizJson = JSON.stringify(moduleData.quiz);
      await sql`
        UPDATE learning_modules 
        SET quiz = ${quizJson}
        WHERE id = ${newModuleId}
      `;
      console.log(`  📝 Quiz data added (${moduleData.quiz.length} questions)`);
    }
    
    console.log('\n✅ All 5 modules imported successfully!');
    
    // Summary
    const moduleCount = await sql`SELECT COUNT(*) as count FROM learning_modules`;
    console.log(`📊 Total modules in database: ${moduleCount[0].count}`);
    
  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await sql.end();
  }
}

importModules();