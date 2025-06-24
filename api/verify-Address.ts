// File: /api/verify-address.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ error: "Address is required" });
    }

    let normalizedAddress = address.replace(/\s+/g, ' ').trim();
    const addressParts = normalizedAddress.split(',');
    let streetPart = addressParts[0] || normalizedAddress;

    if (addressParts.length > 1) {
      streetPart = streetPart
        .replace(/\b(Street|St\.?)\s*$/gi, 'St')
        .replace(/\b(Avenue|Ave\.?)\s*$/gi, 'Ave')
        .replace(/\b(Road|Rd\.?)\s*$/gi, 'Rd')
        .replace(/\b(Boulevard|Blvd\.?)\s*$/gi, 'Blvd')
        .replace(/\b(Trail|Trl\.?)\s*$/gi, 'Trl')
        .replace(/\b(Drive|Dr\.?)\s*$/gi, 'Dr')
        .replace(/\b(Lane|Ln\.?)\s*$/gi, 'Ln')
        .replace(/\b(Court|Ct\.?)\s*$/gi, 'Ct');

      normalizedAddress = streetPart + ', ' + addressParts.slice(1).join(', ');
    } else {
      const words = normalizedAddress.split(/\s+/);
      const statePattern = /\b[A-Z]{2}\b/;
      let streetEndIndex = words.length;

      for (let i = 0; i < words.length; i++) {
        if (statePattern.test(words[i])) {
          streetEndIndex = i;
          break;
        }
      }

      if (streetEndIndex > 2) {
        const possibleSuffix = words[streetEndIndex - 2];
        if (/^(Street|St\.?|Avenue|Ave\.?|Road|Rd\.?|Boulevard|Blvd\.?|Trail|Trl\.?|Drive|Dr\.?|Lane|Ln\.?|Court|Ct\.?)$/i.test(possibleSuffix)) {
          words[streetEndIndex - 2] = possibleSuffix
            .replace(/^(Street|St\.?)$/i, 'St')
            .replace(/^(Avenue|Ave\.?)$/i, 'Ave')
            .replace(/^(Road|Rd\.?)$/i, 'Rd')
            .replace(/^(Boulevard|Blvd\.?)$/i, 'Blvd')
            .replace(/^(Trail|Trl\.?)$/i, 'Trl')
            .replace(/^(Drive|Dr\.?)$/i, 'Dr')
            .replace(/^(Lane|Ln\.?)$/i, 'Ln')
            .replace(/^(Court|Ct\.?)$/i, 'Ct');
        }
      }

      normalizedAddress = words.join(' ');
    }

    const stateZipPattern = /\b([A-Z]{2})\s+(\d{5}(-\d{4})?)\s*$/;
    const stateMatch = normalizedAddress.match(stateZipPattern);

    if (stateMatch) {
      const beforeStateZip = normalizedAddress.substring(0, stateMatch.index).trim();
      const state = stateMatch[1];
      const zip = stateMatch[2];
      const words = beforeStateZip.split(/\s+/);

      if (words.length >= 4) {
        const streetSuffixes = ['St', 'Ave', 'Rd', 'Blvd', 'Trl', 'Dr', 'Ln', 'Ct', 'Way', 'Pl', 'Pkwy', 'Cir'];
        let streetEndIndex = -1;

        for (let i = 1; i < words.length - 1; i++) {
          if (streetSuffixes.includes(words[i])) {
            streetEndIndex = i;
            break;
          }
        }

        if (streetEndIndex > 0 && streetEndIndex < words.length - 1) {
          const streetPart = words.slice(0, streetEndIndex + 1).join(' ');
          const cityPart = words.slice(streetEndIndex + 1).join(' ');
          normalizedAddress = `${streetPart}, ${cityPart}, ${state} ${zip}`;
        } else {
          const lastWord = words[words.length - 1];
          const matches = lastWord.match(/^([A-Z][a-z]+)([A-Z][a-z]+.*)$/);

          if (matches) {
            const streetEnd = matches[1];
            const cityStart = matches[2];
            const streetPart = words.slice(0, -1).concat(streetEnd).join(' ');
            normalizedAddress = `${streetPart}, ${cityStart}, ${state} ${zip}`;
          } else {
            const streetPart = words.slice(0, -1).join(' ');
            normalizedAddress = `${streetPart}, ${lastWord}, ${state} ${zip}`;
          }
        }
      } else {
        normalizedAddress = `${beforeStateZip}, ${state} ${zip}`;
      }
    }

    normalizedAddress = normalizedAddress.replace(/\b\w+/g, word => {
      if (word.length === 2 && /^[A-Z]{2}$/.test(word)) return word;
      if (/^\d{5}(-\d{4})?$/.test(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });

    normalizedAddress = normalizedAddress.replace(/\s*,\s*/g, ', ');

    console.log('Address normalization:', { original: address, normalized: normalizedAddress });

    res.json({ 
      verifiedAddress: normalizedAddress,
      original: address,
      verified: true,
      uspsFormatted: normalizedAddress !== address
    });

  } catch (error) {
    console.error('Address verification error:', error);
    res.status(500).json({ 
      error: "Address verification failed",
      verifiedAddress: req.body.address
    });
  }
}