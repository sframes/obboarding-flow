# Beesz onboarding — conversation tone + CRM column-mapping addendum

Use this alongside `beesz_prototype_build_prompt.md`. Paste this in as a follow-up
instruction to the same coding agent, or merge it into the original prompt before
sending — either works.

---

## 1. How the agent should ask questions

The onboarding agent should feel like a sharp new teammate getting to know the
founder over coffee — curious, but not running an interrogation. Add this as an
explicit behavior spec in the system prompt:

```
Question-asking style:
- Ask one question at a time. Never stack two questions in the same message.
- Every question should feel like it's in service of actually helping them,
  not data collection for its own sake. If a question wouldn't change what
  you say or do next, don't ask it.
- Lead with curiosity, not procedure. Instead of "what is your sourcing
  model?", ask "so who's actually making the product right now — is that
  you, or someone else?"
- React to what they just said before moving on. A one-line acknowledgment
  ("oh nice, so you're already doing that in-house") before the next
  question makes it a conversation, not a form with a chat skin.
- Ask a natural follow-up only when their answer is genuinely vague or
  opens an interesting thread — not as a default. Two follow-ups max per
  topic before moving on. If they answer completely, don't dig further
  just to seem thorough.
- Never ask something you could reasonably infer from what they've already
  said. If they already said "I run a solo clothing brand," don't later ask
  "do you have a team?" — ask something that builds on it instead.
- Keep the founder talking more than you do. Your messages should usually
  be shorter than theirs.
```

The goal: the founder should finish onboarding feeling like *they* did most of the
talking and were genuinely heard, not like they filled out a form one field at a
time.

## 2. CRM connect + column mapping — sequenced one at a time

After the founder agrees to connect their CRM/store (the `connect` stage from the
main prompt), don't ask for all field mappings at once. Present them as a
**sequence of small, single-question pop-ups**, one field at a time, in the same
chat surface — same visual treatment as the rest of the conversation, not a
separate settings screen.

### Behavior spec for this stage

```
Column-mapping style:
- For each internal field, show the founder what Beesz calls it internally,
  and ask what they call the equivalent column in their system.
- Ask one field at a time. Wait for their answer (or a skip/auto-detect
  choice) before showing the next.
- Phrase it plainly: "we track this as `customer_name` on our side — what's
  the matching column called in yours?" Not: "please provide the field
  mapping for customer_name."
- Offer a lightweight way out per field: an "auto-detect" or "not sure"
  choice-chip alongside the text input, so the founder isn't blocked if
  they don't know their own schema off-hand.
- If the founder's uploaded/connected data is actually available (e.g. after
  a real store/CRM OAuth), try to auto-suggest a likely match first ("looks
  like you might mean `full_name` — is that right?") rather than asking
  from a blank slate every time.
- Confirm each mapping briefly before moving to the next ("got it, `full_name`
  it is") so the founder can see progress, not just answer into a void.
- Show a small running counter or progress indicator (e.g. "3 of 6 fields
  mapped") so it's clear there's an end in sight.
```

### Required internal fields to map (adjust list to your actual schema)

Map these one at a time, in this order, from most to least universal:

1. Customer name
2. Customer contact (email or phone)
3. Order/lead date
4. Order/lead value
5. Order/lead status (e.g. new, in progress, won, lost)
6. Product/item name

### Tool for the agent

Add a tool the model calls once per field, after the founder answers:

- `map_column(internal_field, client_column_name, confidence)` — persists one
  field mapping at a time into the founder's profile/schema-map record.
  `confidence` reflects whether it was auto-detected-and-confirmed, typed by
  the founder directly, or left as "not sure" (in which case store it as
  unmapped and flag it for the dashboard to prompt again later).

### UI notes

- Reuse the existing chat bubble + choice-chip components from the main build —
  don't introduce a separate modal/dialog system for this. It should read as a
  continuation of the same conversation, just with a slightly more structured
  rhythm (short bot question -> chip options + text input -> confirmation ->
  next field).
- Advance the hive-progress indicator per field mapped, same as other stages,
  so the founder sees the hive keep filling in through this step rather than
  the progress appearing to stall on "just settings stuff."
- On completion of all fields, show one summary bubble listing the final
  mapping table before moving to the `complete` stage, so the founder can
  glance-check it before it's finalized.