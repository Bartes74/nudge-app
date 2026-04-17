# pickNext — Question Selection Formula

`pickNextQuestions(supabase, opts)` scores all active Layer 2/3/4 questions
and returns the top N candidates for a given user.

## Formula

```
score = priority_base × alreadyKnownFactor × segmentFitFactor × cooldownFactor
```

### priority_base (0–100)
Defined per question in `question_library.priority_base`.
Higher = more impactful for plan quality.

### alreadyKnownFactor
| Condition | Value |
|-----------|-------|
| `user_profile_facts` has a fact for this `field_key` | 0.1 |
| No fact yet | 1.0 |

A factor of 0.1 (not 0) allows re-asking if the user's life has changed
significantly — the question can still surface, but only with very high
`priority_base` and after cooldown.

### segmentFitFactor
| Condition | Value |
|-----------|-------|
| Question has no segment restriction | 0.7 |
| Question targets user's segment (match) | 1.0 |
| Question targets a different segment | 0.2 |

### cooldownFactor
Questions asked fewer than **14 days** ago score 0 (hard cooldown).
After 14 days the factor ramps linearly from 0 → 1.0 over the next
**16 days**, reaching 1.0 at 30 days after the last ask.

```
days_since_asked < 14     → 0
14 ≤ days_since_asked < 30 → (days_since_asked - 14) / 16
days_since_asked ≥ 30     → 1.0
```

### Zero-score rules
A question scores **exactly 0** (excluded) when:
- `history.answeredAt` is set AND `field_key` is present in `user_profile_facts`
  (i.e., fully answered and we have the data — re-ask only after fact decay)

## Anti-spam integration
Callers must enforce the max-1-question-per-session rule at the API layer.
`pickNextQuestions` is stateless — it only scores candidates.

## Example

Given user with segment `weight_loss_beginner`:
- Question A: `priority_base=70`, not known, segment match → `70 × 1.0 × 1.0 × 1.0 = 70`
- Question B: `priority_base=80`, already known → `80 × 0.1 × 1.0 × 1.0 = 8`
- Question C: `priority_base=65`, asked 10 days ago → `65 × 1.0 × 0.7 × 0 = 0` (cooldown)

Top pick → Question A.
