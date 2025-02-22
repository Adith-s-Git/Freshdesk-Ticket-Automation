## Freshdesk App Project

Congratulations on creating your App Project! Feel free to replace this text with your project description.

### Project folder structure explained

    .
    ├── README.md                  This file.
    ├── config                     Installation parameter configs.
    │   ├── iparams.json           Installation parameter config in English language.
    │   └── iparam_test_data.json  Installation parameter data for local testing.
    └── manifest.json              Project manifest.
    └── server                     Business logic for remote request and event handlers.
        ├── lib
        │   └── handle-response.js
        ├── server.js
        └── test_data
            ├── onAppInstall.json
            ├── onAppUninstall.json
            ├── onContactCreate.json
            ├── onContactUpdate.json
            ├── onConversationCreate.json
            ├── onExternalEvent.json
            ├── onTicketCreate.json
            └── onTicketUpdate.json


### Domain Validation: 

 Valid Doamin Format: "company123.freshdesk.com"
 Invalid Domain Format: "123company.freshdesk.com", "Comp9.freshDesk.com", "company123.freshdesk.org"
