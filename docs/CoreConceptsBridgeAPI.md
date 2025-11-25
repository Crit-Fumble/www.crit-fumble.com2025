The Core Concepts Bridge API requires the following components

Inside Foundry VTT
- src\modules\foundry-core-concepts
- src\modules\foundry-core-concepts-api

Between Website and Foundry VTT (redis and bridge logic)
- src\packages\ttrpg-core-concepts-bridge-api

Inside Website
- src\packages\ttrpg-core-concepts-web-api

The Core Concepts Web API will have to be implimented at the website-level, only if users want to use a website for interacting with the Bridge API.