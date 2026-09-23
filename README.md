### 🛡️ Authentication & Session Security Hardening

- **True Stateless Multi-Device Sessions:**
  - Eliminated the global `isLoggedIn` database entity flag to decouple device sessions, allowing concurrent logins across mobile and web clients without session invalidation.
  - Replaced bulk token purging (`deleteByUser`) with isolated, device-specific refresh token persistence.

- **Refresh Token Rotation (RTR):**
  - Implemented automatic single-use token rotation on the `/auth/refresh` endpoint—invalidating and purging consumed refresh tokens from PostgreSQL while simultaneously provisioning a new pair.
  - Defends against token interception and replay abuse.

- **Strict Privilege Separation (Token Purpose Claims):**
  - Added dedicated cryptographic `purpose` claims (`ACCESS_TOKEN` vs. `EMAIL_VERIFICATION`) within the JWT payload.
  - Prevents privilege escalation by ensuring verification tokens cannot be substituted for authenticated API calls.

- **Redis-Backed Token Blacklisting with Dynamic TTL:**
  - Mitigated token replay attacks by blacklisting consumed email verification tokens in Redis upon successful verification.
  - Blacklist keys are configured with dynamic TTLs equal to the token's remaining lifespan, ensuring zero memory leaks through automatic eviction.
  - Implemented null-safe, fail-safe blacklist checks to prevent database or cache connection interruptions from crashing filter chains.

- **Optimized Performance & Layered Decoupling:**
  - Unified user authentication, JWT minting, and refresh token issuance into a single-pass query pipeline returning a consolidated `AuthResultDto`, eliminating redundant database lookups on login.
  - Decoupled `RefreshTokenRepo` interactions entirely from the presentation layer (`AuthController`), moving persistence logic into `RefreshTokenService`.
  - Shifted JWT validation to single-pass cryptographic parsing inside `JwtAuthenticationFilter` to cut CPU hashing overhead in half.

- **Defensive Cookie & Endpoint Scoping:**
  - Restricted refresh token cookies strictly to the `/auth/refresh` URI path with `HttpOnly` and `SameSite=Strict` flags to reduce unnecessary network transmission and token exposure.
  - Enforced generic response contracts across registration and resend verification flows to prevent user enumeration attacks.
  - Locked down write and delete endpoints across `/posts/**` and user profiles behind authentication, while explicitly permitting Prometheus metric scraping (`/actuator/prometheus`) and health probes.
