// Parse a VCF (vCard) file and extract emails and phone numbers

interface ParsedContact {
  name: string;
  emails: string[];
  phones: string[];
}

export function parseVCF(vcfText: string): ParsedContact[] {
  const contacts: ParsedContact[] = [];
  const cards = vcfText.split("BEGIN:VCARD");

  for (const card of cards) {
    if (!card.trim()) continue;

    const lines = card.split(/\r?\n/);
    const contact: ParsedContact = { name: "", emails: [], phones: [] };

    for (const line of lines) {
      // Name
      if (line.startsWith("FN:") || line.startsWith("FN;")) {
        contact.name = line.split(":").slice(1).join(":").trim();
      }

      // Email
      if (line.toUpperCase().startsWith("EMAIL")) {
        const email = line.split(":").slice(1).join(":").trim().toLowerCase();
        if (email && email.includes("@")) {
          contact.emails.push(email);
        }
      }

      // Phone
      if (line.toUpperCase().startsWith("TEL")) {
        const phone = line.split(":").slice(1).join(":").trim();
        const normalized = normalizePhone(phone);
        if (normalized) {
          contact.phones.push(normalized);
        }
      }
    }

    if (contact.emails.length > 0 || contact.phones.length > 0) {
      contacts.push(contact);
    }
  }

  return contacts;
}

// Normalize phone to digits only (strip +, -, spaces, parens)
export function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7) return null;
  // If starts with 1 and is 11 digits, strip the 1
  if (digits.length === 11 && digits.startsWith("1")) {
    return digits.slice(1);
  }
  if (digits.length === 10) return digits;
  return digits; // Return as-is for international numbers
}
