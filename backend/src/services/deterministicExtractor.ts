import { LegalAnalysisResult, CaseClassification, DocumentMetadata, Party, LegalProvision, CaseSummary, ImportantPassage } from '../schemas/analysisSchema.js';

export class DeterministicLegalExtractor {
  public static analyze(text: string, originalFilename: string): LegalAnalysisResult {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const textLower = text.toLowerCase();

    // 1. Extract Court Name
    const court = this.extractCourt(text);

    // 2. Extract Case Number & Title
    const { caseNumber, title, decisionDate, bench } = this.extractMetadata(text, originalFilename);

    // 3. Extract Parties
    const parties = this.extractParties(text);

    // 4. Classify Case Type
    const classification = this.classifyCase(text, originalFilename, court);

    // 5. Extract Legal Provisions
    const legalProvisions = this.extractProvisions(text);

    // 6. Extract Outcome & Summary
    const summary = this.extractSummary(text, classification.primary, parties);

    // 7. Important Passages
    const importantPassages = this.extractPassages(text, summary.outcome, classification.primary);

    return {
      caseClassification: classification,
      documentMetadata: {
        title,
        court,
        caseNumber,
        decisionDate,
        bench,
        jurisdiction: court?.includes('Supreme Court') ? 'Apex Court / Pan-India' : court?.includes('High Court') ? 'State High Court Jurisdiction' : 'District/Tribunal Jurisdiction',
      },
      parties,
      legalProvisions,
      summary,
      importantPassages,
      aiAnalysisInfo: {
        method: 'local-deterministic',
        model: 'Deterministic Rule-Based Legal Engine (India Jurisdiction)',
        analyzedAt: new Date().toISOString(),
        tokenUsageEstimate: 0,
        isDemoMode: true,
      },
    };
  }

  private static extractCourt(text: string): string | null {
    const first1500 = text.substring(0, 1500);
    if (/supreme court of india/i.test(first1500)) return 'Supreme Court of India';
    
    const hcMatch = first1500.match(/high court of ([a-zA-Z\s]+?)(?:at|bench|\n|,|\()/i);
    if (hcMatch) return `High Court of ${hcMatch[1].trim()}`;
    
    if (/delhi high court/i.test(first1500)) return 'High Court of Delhi';
    if (/bombay high court/i.test(first1500)) return 'High Court of Judicature at Bombay';
    if (/calcutta high court/i.test(first1500)) return 'High Court at Calcutta';
    if (/madras high court/i.test(first1500)) return 'High Court of Judicature at Madras';
    if (/allahabad high court/i.test(first1500)) return 'High Court of Judicature at Allahabad';
    if (/national company law tribunal|nclt/i.test(first1500)) return 'National Company Law Tribunal (NCLT)';
    if (/national company law appellate tribunal|nclat/i.test(first1500)) return 'National Company Law Appellate Tribunal (NCLAT)';
    if (/central administrative tribunal|cat/i.test(first1500)) return 'Central Administrative Tribunal';
    if (/district court/i.test(first1500)) return 'District & Sessions Court';

    return 'Court / Judicial Authority (Unspecified in header)';
  }

  private static extractMetadata(text: string, originalFilename: string) {
    const first2000 = text.substring(0, 2000);
    
    // Case number patterns
    // e.g. "W.P.(C) No. 1234/2023", "Criminal Appeal No. 45 of 2022", "Civil Appeal No. 901/2021"
    const caseNumRegex = /(?:W\.?P\.?\s*\(?(?:C|Crl|MD)?\)?\s*No\.?\s*[\d\/\-]+(?:\s*of\s*\d{4})?|Criminal Appeal No\.?\s*[\d\/\-]+(?:\s*of\s*\d{4})?|Civil Appeal No\.?\s*[\d\/\-]+(?:\s*of\s*\d{4})?|SLP\s*\(?(?:C|Crl)\)?\s*No\.?\s*[\d\/\-]+|Bail Appln\.?\s*No\.?\s*[\d\/\-]+|Arbitration Petition No\.?\s*[\d\/\-]+|Company Petition No\.?\s*[\d\/\-]+|O\.?M\.?P\.?\s*No\.?\s*[\d\/\-]+|Suit No\.?\s*[\d\/\-]+)/i;
    const caseNumMatch = first2000.match(caseNumRegex);
    const caseNumber = caseNumMatch ? caseNumMatch[0].trim() : null;

    // Date pattern e.g., "DATE OF DECISION: 14.05.2023", "Dated: 12th October 2022", "Decided on: November 4, 2021"
    const dateRegex = /(?:DATE OF DECISION|DATED|DECIDED ON|ORDER DATED|PRONOUNCED ON)[\s:]*([0-9]{1,2}(?:st|nd|rd|th)?[\s\.\-\/]+[A-Za-z0-9]+[\s\.\-\/]+[0-9]{4})/i;
    const dateMatch = text.match(dateRegex);
    let decisionDate = dateMatch ? dateMatch[1].trim() : null;

    // Bench / Judge coram
    const bench: string[] = [];
    const coramMatch = text.match(/(?:CORAM|BEFORE|PRESENT)[\s:]*([^\n\r]+(?:\n[^\n\r]+)?)/i);
    if (coramMatch) {
      const coramLine = coramMatch[1];
      const judgeMatches = coramLine.match(/(?:HON'BLE\s+)?(?:MR\.|MS\.|DR\.)?\s*JUSTICE\s+[A-Z\s\.]+/gi);
      if (judgeMatches) {
        judgeMatches.forEach((j) => bench.push(j.trim()));
      } else {
        bench.push(coramLine.replace(/\r|\n/g, ' ').trim());
      }
    }

    const title = caseNumber ? `${caseNumber} - ${originalFilename.replace(/\.[^/.]+$/, '')}` : originalFilename.replace(/\.[^/.]+$/, '');

    return { caseNumber, title, decisionDate, bench };
  }

  private static extractParties(text: string): Party[] {
    const parties: Party[] = [];
    const first3000 = text.substring(0, 3000);

    // Pattern: Party A ... Petitioner / Appellant VERSUS Party B ... Respondent
    const versusMatch = first3000.match(/([\s\S]+?)\s+(?:VERSUS|V\/S|VS\.|V\.)\s+([\s\S]+?)(?:\.\.\.|\n\n|ORDER|JUDGMENT|CORAM)/i);
    
    if (versusMatch) {
      const petPart = versusMatch[1].trim();
      const respPart = versusMatch[2].trim();

      // Extract petitioner name
      const petLines = petPart.split('\n').map((l) => l.trim()).filter((l) => l.length > 2 && !/court|high|supreme|bench|jurisdiction/i.test(l));
      if (petLines.length > 0) {
        const petName = petLines[petLines.length - 1].replace(/\.{2,}/g, '').replace(/Petitioner\(s\)|Appellant\(s\)/gi, '').trim();
        if (petName.length > 2) {
          parties.push({
            name: petName,
            role: /appellant/i.test(petPart) ? 'Appellant' : 'Petitioner',
            evidence: petPart.substring(0, 200).replace(/\s+/g, ' '),
          });
        }
      }

      // Extract respondent name
      const respLines = respPart.split('\n').map((l) => l.trim()).filter((l) => l.length > 2 && !/order|judgment|coram|before/i.test(l));
      if (respLines.length > 0) {
        const respName = respLines[0].replace(/\.{2,}/g, '').replace(/Respondent\(s\)|State of/gi, (m) => m).trim();
        if (respName.length > 2) {
          parties.push({
            name: respName,
            role: 'Respondent',
            evidence: respPart.substring(0, 200).replace(/\s+/g, ' '),
          });
        }
      }
    }

    // Advocates
    const advMatch = text.match(/(?:Advocates?\s+for\s+(?:the\s+)?Petitioner|For\s+Petitioner|For\s+Appellant)[\s:]*([^\n\r]+)/i);
    if (advMatch) {
      parties.push({
        name: advMatch[1].replace(/\r|\n/g, ' ').trim(),
        role: 'Counsel for Petitioner / Appellant',
        evidence: advMatch[0].trim(),
      });
    }

    const respAdvMatch = text.match(/(?:Advocates?\s+for\s+(?:the\s+)?Respondent|For\s+Respondent)[\s:]*([^\n\r]+)/i);
    if (respAdvMatch) {
      parties.push({
        name: respAdvMatch[1].replace(/\r|\n/g, ' ').trim(),
        role: 'Counsel for Respondent / State',
        evidence: respAdvMatch[0].trim(),
      });
    }

    return parties;
  }

  private static classifyCase(text: string, filename: string, court: string | null): CaseClassification {
    const textLower = text.toLowerCase();
    const evidence: string[] = [];
    const secondary: string[] = [];
    let primary = 'Civil';
    let confidence = 0.85;

    // Check criminal indicators
    const isCriminalAppeal = /criminal appeal|crl\.?\s*a|crl\.?\s*rev|crl\.?\s*m\.?c/i.test(text);
    const isBail = /bail application|regular bail|anticipatory bail|under section 438|under section 439/i.test(text);
    const hasIPC = /penal code|ipc|section 302|section 376|section 420|section 498a|fir no|police station/i.test(text);
    const hasCrPC = /code of criminal procedure|cr\.?p\.?c|section 482/i.test(text);

    // Check writ / constitutional
    const isWrit = /writ petition|w\.?p\.\s*\(c\)|w\.?p\.\s*\(crl\)|article 226|article 32|mandamus|certiorari|habeas corpus|quo warranto/i.test(text);
    const isConstitutional = /constitution of india|fundamental rights|article 14|article 19|article 21/i.test(text);

    // Check commercial / arbitration / corporate
    const isArbitration = /arbitration and conciliation act|section 11|section 34|arbitral award|sole arbitrator/i.test(text);
    const isIBC = /insolvency and bankruptcy|nclt|operational creditor|financial creditor|corporate debtor/i.test(text);
    const isCommercial = /commercial division|commercial court act|commercial suit/i.test(text);

    // Check service / employment
    const isService = /service matter|central administrative tribunal|pension|promotion|disciplinary proceedings|termination of service/i.test(text);

    // Check family
    const isFamily = /hindu marriage act|divorce petition|maintenance under section 125|custody of child|family court/i.test(text);

    // Check property
    const isProperty = /partition suit|specific performance|title suit|suit for declaration|transfer of property act|eviction petition/i.test(text);

    // Check tax
    const isTax = /income tax act|gst|goods and services tax|assessment year|commissioner of income tax/i.test(text);

    if (isBail) {
      primary = 'Criminal';
      secondary.push('Bail Application');
      evidence.push('Contains prayer for bail and references to Section 438/439 Cr.P.C.');
      confidence = 0.94;
    } else if (isCriminalAppeal || (hasIPC && hasCrPC)) {
      primary = 'Criminal';
      if (hasIPC) secondary.push('Penal Code Offences');
      evidence.push('Cites Code of Criminal Procedure and Indian Penal Code provisions.');
      confidence = 0.92;
    } else if (isWrit) {
      primary = 'Writ Petition';
      secondary.push('Constitutional');
      if (isService) secondary.push('Service and Employment');
      evidence.push('Invokes extraordinary writ jurisdiction under Article 226 or Article 32 of the Constitution.');
      confidence = 0.95;
    } else if (isConstitutional) {
      primary = 'Constitutional';
      secondary.push('Civil');
      evidence.push('Directly adjudicates fundamental rights and constitutional principles.');
      confidence = 0.90;
    } else if (isArbitration) {
      primary = 'Commercial';
      secondary.push('Arbitration');
      evidence.push('Governed by Arbitration and Conciliation Act, 1996.');
      confidence = 0.93;
    } else if (isIBC) {
      primary = 'Commercial';
      secondary.push('Insolvency & Bankruptcy');
      evidence.push('Involves Corporate Insolvency Resolution Process under IBC, 2016.');
      confidence = 0.92;
    } else if (isService) {
      primary = 'Service and Employment';
      secondary.push('Administrative');
      evidence.push('Pertains to public service, employment rules, promotion, or departmental inquiry.');
      confidence = 0.88;
    } else if (isFamily) {
      primary = 'Family';
      secondary.push('Civil');
      evidence.push('Matrimonial / family dispute under personal law or maintenance statutes.');
      confidence = 0.91;
    } else if (isProperty) {
      primary = 'Property';
      secondary.push('Civil');
      evidence.push('Property title, possession, injunction, or Transfer of Property Act.');
      confidence = 0.89;
    } else if (isTax) {
      primary = 'Tax';
      secondary.push('Administrative');
      evidence.push('Involves statutory assessment under Income Tax Act or GST.');
      confidence = 0.92;
    } else {
      primary = 'Civil';
      evidence.push('Standard civil appeal / suit jurisdiction governed by Code of Civil Procedure.');
      confidence = 0.80;
    }

    return { primary, secondary, confidence, evidence };
  }

  private static extractProvisions(text: string): LegalProvision[] {
    const provisions: LegalProvision[] = [];
    const seen = new Set<string>();

    const addProvision = (name: string, type: string, context: string, evidence: string) => {
      const key = `${name}-${type}`;
      if (!seen.has(key)) {
        seen.add(key);
        provisions.push({ name, type, context, evidence });
      }
    };

    // Constitutional articles
    const articleRegex = /Article\s+(\d+(?:\([0-9a-zA-Z]+\))*)\s+(?:of\s+the\s+Constitution(?:\s+of\s+India)?)/gi;
    let match;
    while ((match = articleRegex.exec(text)) !== null) {
      addProvision(
        `Article ${match[1]} of the Constitution of India`,
        'Constitutional Article',
        `Invoked for constitutional remedies / fundamental right safeguard`,
        match[0]
      );
    }

    // Specific famous sections
    const commonStatutes = [
      { regex: /Section\s+(\d+[A-Za-z]*(?:\([0-9a-zA-Z]+\))*)\s+(?:of\s+(?:the\s+)?(?:Indian\s+Penal\s+Code|IPC))/gi, statute: 'Indian Penal Code, 1860 (IPC)', type: 'Statutory Section' },
      { regex: /Section\s+(\d+[A-Za-z]*(?:\([0-9a-zA-Z]+\))*)\s+(?:of\s+(?:the\s+)?(?:Code\s+of\s+Criminal\s+Procedure|Cr\.?P\.?C))/gi, statute: 'Code of Criminal Procedure, 1973 (CrPC)', type: 'Statutory Section' },
      { regex: /Section\s+(\d+[A-Za-z]*(?:\([0-9a-zA-Z]+\))*)\s+(?:of\s+(?:the\s+)?(?:Code\s+of\s+Civil\s+Procedure|CPC))/gi, statute: 'Code of Civil Procedure, 1908 (CPC)', type: 'Statutory Section' },
      { regex: /Order\s+([A-Z0-9]+)\s+Rule\s+([0-9A-Za-z\s&,]+)\s+(?:of\s+(?:the\s+)?CPC)/gi, statute: 'Code of Civil Procedure, 1908 (CPC)', type: 'Court Procedure Rule' },
      { regex: /Section\s+(\d+[A-Za-z]*)\s+(?:of\s+(?:the\s+)?(?:Arbitration\s+and\s+Conciliation\s+Act|Arbitration\s+Act))/gi, statute: 'Arbitration and Conciliation Act, 1996', type: 'Statutory Section' },
      { regex: /Section\s+(\d+[A-Za-z]*)\s+(?:of\s+(?:the\s+)?(?:Negotiable\s+Instruments\s+Act|NI\s+Act))/gi, statute: 'Negotiable Instruments Act, 1881', type: 'Statutory Section' },
      { regex: /Section\s+(\d+[A-Za-z]*)\s+(?:of\s+(?:the\s+)?(?:Insolvency\s+and\s+Bankruptcy\s+Code|IBC))/gi, statute: 'Insolvency and Bankruptcy Code, 2016', type: 'Statutory Section' },
    ];

    for (const item of commonStatutes) {
      let statMatch;
      while ((statMatch = item.regex.exec(text)) !== null) {
        const provisionName = statMatch[2] ? `Order ${statMatch[1]} Rule ${statMatch[2]}` : `Section ${statMatch[1]}`;
        addProvision(
          `${provisionName}, ${item.statute}`,
          item.type,
          `Statutory compliance and procedural adjudication under ${item.statute}`,
          statMatch[0]
        );
      }
    }

    // Generic references if specific didn't catch enough
    if (provisions.length === 0) {
      if (/Article 226/i.test(text)) addProvision('Article 226, Constitution of India', 'Constitutional Article', 'High Court writ jurisdiction', 'Article 226');
      if (/Article 32/i.test(text)) addProvision('Article 32, Constitution of India', 'Constitutional Article', 'Supreme Court writ remedies', 'Article 32');
      if (/Section 482/i.test(text)) addProvision('Section 482, CrPC', 'Statutory Section', 'Inherent powers of High Court to prevent abuse of process', 'Section 482');
      if (/Section 439/i.test(text)) addProvision('Section 439, CrPC', 'Statutory Section', 'Special powers of High Court / Sessions Court regarding bail', 'Section 439');
      if (/Section 138/i.test(text)) addProvision('Section 138, NI Act', 'Statutory Section', 'Dishonour of cheque for insufficiency of funds', 'Section 138');
    }

    return provisions.slice(0, 10);
  }

  private static extractSummary(text: string, primaryCaseType: string, parties: Party[]): CaseSummary {
    const textLower = text.toLowerCase();
    const last3000 = text.substring(Math.max(0, text.length - 3000));
    const last3000Lower = last3000.toLowerCase();

    // Determine final outcome
    let outcomeCategory: any = 'Other';
    let outcome = 'The matter was disposed of by the Court.';

    if (/petition\s+is\s+allowed|appeal\s+is\s+allowed|application\s+is\s+allowed/i.test(last3000)) {
      outcomeCategory = 'Allowed';
      outcome = 'The petition/appeal was allowed. The relief prayed for by the petitioner/appellant was granted by the Court.';
    } else if (/petition\s+is\s+dismissed|appeal\s+is\s+dismissed|leave\s+refused|find\s+no\s+merit/i.test(last3000)) {
      outcomeCategory = 'Dismissed';
      outcome = 'The petition/appeal was dismissed for lack of merit, and the impugned order/judgment was upheld.';
    } else if (/partly\s+allowed/i.test(last3000)) {
      outcomeCategory = 'Partly Allowed';
      outcome = 'The petition/appeal was partly allowed with modified conditions/relief.';
    } else if (/remanded\s+back|remitted\s+to|matter\s+is\s+remanded/i.test(last3000)) {
      outcomeCategory = 'Remanded';
      outcome = 'The matter was remanded back to the lower forum/authority for fresh adjudication in accordance with law.';
    } else if (/bail\s+is\s+granted|admitted\s+to\s+bail|enlarged\s+on\s+bail/i.test(last3000)) {
      outcomeCategory = 'Allowed';
      outcome = 'Bail was granted to the applicant subject to furnishing personal bond and surety.';
    } else if (/quashed|set\s+aside/i.test(last3000)) {
      outcomeCategory = 'Allowed';
      outcome = 'The impugned order, FIR, or proceedings were quashed and set aside by the Court.';
    } else if (/disposed\s+of\s+with\s+directions|petition\s+stands\s+disposed\s+of/i.test(last3000)) {
      outcomeCategory = 'Disposed of with Directions';
      outcome = 'The petition was disposed of with specific binding directions issued to the competent authorities.';
    }

    // Facts extraction
    const facts: string[] = [];
    const factMatch = text.match(/(?:brief facts|facts of the case|factual matrix|facts leading to)[\s:]*([^\n\r]+(?:\n[^\n\r]+){1,4})/i);
    if (factMatch) {
      facts.push(factMatch[1].replace(/\r|\n/g, ' ').substring(0, 300).trim() + '...');
    } else {
      facts.push(`Proceedings arise out of a ${primaryCaseType.toLowerCase()} dispute submitted before the Court for judicial determination.`);
      if (parties.length > 0) {
        facts.push(`Action initiated by ${parties[0]?.name || 'the Petitioner'} seeking judicial intervention against the respondents.`);
      }
    }

    // Legal issues
    const legalIssues: string[] = [];
    const issueMatch = text.match(/(?:point for consideration|question that arises|issue for determination|the question is whether)[\s:]*([^\n\r]+(?:\n[^\n\r]+){1,3})/i);
    if (issueMatch) {
      legalIssues.push(issueMatch[1].replace(/\r|\n/g, ' ').substring(0, 300).trim());
    } else {
      legalIssues.push(`Whether the impugned decision or statutory action warrants interference under the provisions of the governing Act.`);
      legalIssues.push(`Whether principles of natural justice and applicable statutory procedures were complied with.`);
    }

    // Arguments
    const argumentsList: string[] = [
      `Petitioner/Appellant contended that the impugned action was contrary to law, arbitrary, and caused substantive prejudice.`,
      `Respondent counsel supported the impugned action/judgment and submitted that the findings were within jurisdiction.`,
    ];

    // Reasoning
    const reasoning: string[] = [
      `The Court examined the statutory framework, evidentiary records, and authoritative judicial precedents cited by both parties.`,
      `The Bench noted that judicial review is confined to the decision-making process and statutory correctness.`,
    ];

    return {
      overview: `A ${primaryCaseType} matter decided by ${parties.length > 0 ? parties[0].name + ' v. Respondent' : 'the parties'}, concerning judicial review, statutory interpretation, and the grant of legal reliefs under Indian law.`,
      facts,
      legalIssues,
      arguments: argumentsList,
      reasoning,
      outcome,
      outcomeCategory,
      limitations: [
        'Extracted via Local Deterministic Rule-Based Legal Engine (Demo Mode).',
        'Factual accuracy depends on OCR/text clarity in the uploaded judgment file.',
        'Always verify with the certified copy from the respective Court registry.',
      ],
    };
  }

  private static extractPassages(text: string, outcome: string, caseType: string): ImportantPassage[] {
    const passages: ImportantPassage[] = [];
    const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p.length > 50);

    // Find holding/disposition paragraph
    for (let i = paragraphs.length - 1; i >= Math.max(0, paragraphs.length - 10); i--) {
      const p = paragraphs[i];
      if (/accordingly|consequently|in view of the above|ordered accordingly|petition is|appeal is/i.test(p)) {
        passages.push({
          text: p.substring(0, 350) + (p.length > 350 ? '...' : ''),
          purpose: 'Final Court Disposition & Operative Order',
          page: 1,
        });
        break;
      }
    }

    // Find core reasoning paragraph
    for (const p of paragraphs) {
      if (/we are of the considered view|in our opinion|it is well settled that|trite law that/i.test(p)) {
        passages.push({
          text: p.substring(0, 350) + (p.length > 350 ? '...' : ''),
          purpose: 'Substantive Judicial Reasoning & Holding',
          page: 1,
        });
        if (passages.length >= 3) break;
      }
    }

    // If still empty, add representative excerpts
    if (passages.length === 0 && paragraphs.length > 0) {
      passages.push({
        text: paragraphs[0].substring(0, 300) + '...',
        purpose: 'Case Opening & Procedural Context',
        page: 1,
      });
      if (paragraphs.length > 1) {
        passages.push({
          text: paragraphs[paragraphs.length - 1].substring(0, 300) + '...',
          purpose: 'Concluding Judicial Directions',
          page: 1,
        });
      }
    }

    return passages;
  }
}
