declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    LOQTAH_ADMIN_USER_IDS?: string;
  }
}
