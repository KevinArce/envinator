# 1.0.0 (2026-02-08)


### Bug Fixes

* **scanner:** optimize performance and fix optional chaining detection ([f6eedc1](https://github.com/KevinArce/envinator/commit/f6eedc173f685f64c852654e602c5167dc50a3ad))


### Features

* Add unused environment variable detection and reporting to the analyzer and UI. ([e28d592](https://github.com/KevinArce/envinator/commit/e28d592a52b8f38729d004ef4ea40a957307c386))
* Implement hardcoded secret leak detection and reporting in scan results. ([9a8e578](https://github.com/KevinArce/envinator/commit/9a8e5786302b9370c9877f1413ee7f64ab63008b))
* Implement semantic-release for automated versioning, changelog generation, and package publishing. ([e2bfede](https://github.com/KevinArce/envinator/commit/e2bfedec70d530376e39e89df2e43f822f570ed9))
* Introduce `--types` CLI option to generate `env.d.ts` for `process.env` type safety. ([9f26bf0](https://github.com/KevinArce/envinator/commit/9f26bf09ee7b9930d96d78ab899de62445194d07))
* Introduce custom branding to the CLI, update package name to `envinator-cli`, and document unused variable detection. ([31a7578](https://github.com/KevinArce/envinator/commit/31a75780ebe575c07ad1001f7631608bf0d44f24))
* Rebrand the tool from 'env-wizard' to 'Envinator' with a Terminator-themed narrative and updated UI messages. ([2a0050a](https://github.com/KevinArce/envinator/commit/2a0050a637066508bb2ac51c7527c8a9ba083065))
* Scope package name and add public publish configuration. ([599ef31](https://github.com/KevinArce/envinator/commit/599ef312babff54787a50dd8ab144f1f8bd3f943))
* **ui:** implement secure input masking for sensitive variables ([e54ee0e](https://github.com/KevinArce/envinator/commit/e54ee0eee41fe9475ed55ed53d01ed080ac1a4a4))


### Performance Improvements

* Optimize AST traversal in scanner ([f0a3c19](https://github.com/KevinArce/envinator/commit/f0a3c199659f4e499426187d03158dddb5ef3056))
* Optimize Env Usage Membership Check ([b6c8cfc](https://github.com/KevinArce/envinator/commit/b6c8cfce5b93183db14dab97e755e8470571f0aa))
