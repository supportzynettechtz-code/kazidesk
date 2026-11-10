import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'KaziDesk Office Management System', timestamp: new Date().toISOString() });
});

// AI Office Assistant endpoint for drafting official letters, memos, policies, and contracts
app.post('/api/ai/draft-office-doc', async (req: Request, res: Response) => {
  try {
    const { docType, topic, recipient, language = 'sw', keyPoints, senderRole } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Return high-quality structured template fallback if API key is not yet set
      const isSw = language === 'sw';
      const refNo = `KD/OFISI/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`;
      const today = new Date().toLocaleDateString(isSw ? 'sw-TZ' : 'en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      return res.json({
        success: true,
        isFallback: true,
        document: {
          refNumber: refNo,
          date: today,
          title: topic || (isSw ? 'Waraka Rasmi wa Ofisi' : 'Official Office Notice'),
          content: isSw 
            ? `KUMB. NA: ${refNo}\nTAREHE: ${today}\nKWA: ${recipient || 'Wafanyakazi Wote'}\nKUTOKA: ${senderRole || 'Mkurugenzi Mtendaji'}\n\nKUHUSU: ${topic.toUpperCase()}\n\nTafadhali rejea mada iliyotajwa hapo juu.\n\nUongozi wa ofisi unapenda kuwataarifu wote kuhusu jambo hili muhimu:\n1. ${keyPoints || 'Kuzingatia kanuni na nidhamu ya kazi ofisini wakati wote.'}\n2. Kila idara inapaswa kuhakikisha majukumu yote yanakamilika kwa wakati uliopangwa.\n3. Kwa ufafanuzi au maswali yoyote, wasiliana na Ofisi ya Rasilimali Watu (HR).\n\nTunawatakia utekelezaji mwema na wenye ufanisi.\n\nWenu katika ujenzi wa ofisi,\n\n___________________________\n${senderRole || 'Uongozi wa KaziDesk'}`
            : `REF NO: ${refNo}\nDATE: ${today}\nTO: ${recipient || 'All Staff Members'}\nFROM: ${senderRole || 'Executive Director'}\n\nSUBJECT: ${topic.toUpperCase()}\n\nPlease refer to the subject mentioned above.\n\nManagement wishes to bring to your attention the following key directives:\n1. ${keyPoints || 'Adherence to standard office procedures and professional decorum at all times.'}\n2. All department heads should ensure milestone deliverables are met on schedule.\n3. For any inquiries, please contact Human Resources.\n\nSincerely,\n\n___________________________\n${senderRole || 'KaziDesk Executive Office'}`
        }
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Wewe ni Katibu Mkuu na Mtaalamu Mwandamizi wa Utawala wa Ofisi na Rasilimali Watu (Senior Executive Office Administrator & Legal Secretary).
Tafadhali andika nyaraka rasmi ya kiofisi yenye muundo safi, weledi wa juu wa kiutawala, na maneno fasaha kulingana na maelezo yafuatayo:
- Aina ya Nyaraka (Document Type): ${docType || 'Memo ya Ndani / Internal Memo'}
- Mada / Kusudio (Topic/Purpose): ${topic}
- Mpokeaji (Recipient): ${recipient || 'Wafanyakazi Wote'}
- Mtoaji / Wadhifa (Sender/Role): ${senderRole || 'Mkurugenzi Mtendaji'}
- Hoja Kuu (Key Points): ${keyPoints || 'Taratibu za ofisi na uboreshaji wa kazi'}
- Lugha (Language): ${language === 'en' ? 'Kiingereza (English)' : 'Kiswahili Rasmi cha Kiofisi (Official Tanzanian Swahili)'}

Muundo unapaswa kujumuisha:
1. Kumbukumbu Namba (Reference Number) k.m. KD/HQ/2026/...
2. Tarehe Rasmi
3. Kwa / To & Kutoka / From
4. Mada / Subject (kwa herufi kubwa)
5. Aya ya Utangulizi
6. Hoja Kuu zilizopangwa vizuri (vifungu au namba)
7. Maagizo ya Utekelezaji na Mwisho
8. Sahihi na Jina la Mamlaka

Toa majibu moja kwa moja kama nyaraka kamili bila maelezo mengine ya ziada nje ya nyaraka yenyewe.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const outputText = response.text || '';
    const refMatch = outputText.match(/KUMB(?:UKUMBU)?\s*\.?\s*NA[\s:]+([^\n\r]+)/i) || outputText.match(/REF\s*\.?\s*NO[\s:]+([^\n\r]+)/i);
    const refNo = refMatch ? refMatch[1].trim() : `KD/OFISI/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`;

    res.json({
      success: true,
      document: {
        refNumber: refNo,
        date: new Date().toLocaleDateString(language === 'sw' ? 'sw-TZ' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
        title: topic,
        content: outputText
      }
    });
  } catch (error: any) {
    console.error('AI Draft Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Hitilafu wakati wa kutengeneza nyaraka' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KaziDesk Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
