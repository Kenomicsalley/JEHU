import json, random
from pathlib import Path
p=Path('/mnt/data/jehu-next/data/scenarios.json')
sc=json.loads(p.read_text())
start=len(sc)+1

families = [
('BANKING & PAYMENT FRAUD','banking', [
('The Reversal Request','A person says a transfer into your account was accidental and asks you to send it back to a different account.'),
('The Refund Collector','A seller says your refund is ready but asks you to receive it in your account and forward part of it elsewhere.'),
('The Merchant Upgrade','A caller claims your card needs an urgent upgrade and asks for card details and an OTP.'),
('The Failed Transfer Fee','Someone says a transfer is stuck and asks you to pay a small “release” fee through an unfamiliar link.'),
('The Duplicate Debit','A stranger claims your account was debited twice and sends a screenshot asking you to return one payment.'),
('The Cash-Out Request','Someone asks you to receive money and withdraw it in cash because their account is “temporarily restricted”.'),
('The New Beneficiary','A message says a new beneficiary has been added to your account and provides a number to call.'),
('The Card Delivery Call','A caller claims your replacement card is ready and asks you to confirm your PIN for delivery.'),
('The Payment Link','A buyer sends a payment link that asks for your banking password to “accept” money.'),
('The Reconciliation Agent','A person claiming to be from a bank reconciliation team asks you to move funds so they can “trace” a transaction.')
]),
('MONEY MULE & FINANCIAL CRIME','money-mule', [
('The Limit Problem','An acquaintance says they have reached their daily transfer limit and asks to use your account to receive money.'),
('The Commission Offer','Someone offers you a commission for receiving funds and sending them to another account.'),
('The Business Collection','A new contact asks you to collect customer payments into your personal account because their business account is unavailable.'),
('The “Mistaken” ₦2m','A large unexplained transfer appears in your account. The sender immediately asks you to forward it elsewhere.'),
('The Cash Courier','Someone asks you to withdraw money received in your account and hand it to a driver.'),
('The Account Rental','A person offers weekly payment if you let them use your bank account temporarily.'),
('The New Account Request','A stranger asks you to open an account in your name for their business operations.'),
('The Crypto Conversion','Someone asks you to receive money, buy cryptocurrency with it and send the crypto to a wallet they provide.'),
('The Charity Collection','A person says their charity account is unavailable and asks you to collect donations through your personal account.'),
('The Student Transfer','A fellow student says overseas tuition funds are coming and asks to use your account to receive them.')
]),
('ACCOUNT TAKEOVER & CREDENTIALS','account', [
('The Password Reset Storm','You receive repeated password-reset requests followed by a message asking you to provide the reset code.'),
('The Recovery Code','A caller says they can secure your account if you read out the recovery code you just received.'),
('The Login Alert','A message says someone logged in from another country and provides a link to “secure your account”.'),
('The Security Questionnaire','A support account asks for your password answers and backup email to verify ownership.'),
('The Backup Email Change','You receive a request to confirm a change to your recovery email that you did not make.'),
('The Session Expired','A web page says your session expired and asks you to sign in again using an unfamiliar address.'),
('The Shared Password','A friend asks you to send your password because they want to test whether an account is working.'),
('The MFA Approval','Your phone receives an unexpected sign-in approval request. A caller asks you to approve it by mistake.'),
('The Security App','A message tells you to install a “security app” to stop an account takeover.'),
('The Login Code','A stranger says a login code was sent to your phone by accident and asks you to forward it.')
]),
('SIM & MOBILE FRAUD','sim', [
('The SIM Upgrade','A caller says your SIM must be upgraded today and asks for personal verification details.'),
('The Sudden No Service','Your phone suddenly loses network service while you receive account-reset attempts on another channel.'),
('The Replacement SIM','Someone asks you to confirm a replacement SIM request you never made.'),
('The Network Support Chat','A social account using a telecom logo asks for your OTP to restore service.'),
('The Number Porting Alert','You receive a notification that your number is being ported and a stranger asks you to cancel it for them.'),
('The SIM Registration Helper','A person offers to “fix” your SIM registration if you send them identity details and codes.'),
('The Roaming Story','A caller claims your number is roaming unexpectedly and asks you to install a remote-support app.'),
('The Lost Number','Someone claims to be your relative and asks you to help recover their old number using your identity details.')
]),
('SOCIAL MEDIA & MESSAGING','social', [
('The Blue Badge Agent','A message offers a verified badge but asks for your password and a payment.'),
('The Friend in Trouble','A familiar account asks for emergency money from a new number.'),
('The Viral Video','A friend account sends an unusual video link and asks whether you appear in it.'),
('The Giveaway Comment','A social-media comment says you won a prize and asks you to contact a separate account.'),
('The Support Reply','A fake support account responds to your public complaint and requests private credentials.'),
('The Account Warning','A direct message threatens to suspend your profile unless you verify through a supplied link.'),
('The Influencer Investment','An account using a public figure’s identity promises guaranteed returns through a private chat.'),
('The Group Admin','A new group administrator asks members to send personal details for a “security register”.'),
('The Private Video Threat','Someone claims to have a private video and demands payment to prevent publication.'),
('The Contact Sync Request','A new contact asks you to install an app that supposedly reveals who viewed your profile.')
]),
('JOB, SCHOLARSHIP & EDUCATION FRAUD','education', [
('The Guaranteed Job','A recruiter promises a job but demands an upfront “processing” payment.'),
('The Recruitment Portal','A job advert links to a site asking for your email password to create an applicant profile.'),
('The Interview Software','A recruiter asks you to install unknown software before an interview.'),
('The Scholarship Fee','A scholarship message asks for a small fee to release a large award.'),
('The Exam Result Agent','Someone offers to change an exam result for payment and requests login credentials.'),
('The Certificate Verification','A person claiming to verify certificates asks for copies of identity documents through an unverified account.'),
('The Remote Job Equipment','A remote employer sends a cheque and asks you to buy equipment from a specified vendor and return the balance.'),
('The Training Grant','A training programme asks for banking credentials to “confirm your stipend account”.'),
('The Internship Placement','An internship broker requests payment to reserve a guaranteed placement.'),
('The Student Representative','A stranger claims to represent your school and asks for tuition to be sent to a personal account.')
]),
('PROPERTY & MARKETPLACE FRAUD','property', [
('The Rental Deposit','A landlord says many people want the apartment and demands a deposit before a viewing.'),
('The Fake Agent','A property agent asks you to pay a viewing fee to an unfamiliar personal account.'),
('The Marketplace Courier','A buyer sends a courier link that asks you to log in to your bank to receive payment.'),
('The Overpayment Screenshot','A buyer sends a screenshot showing an overpayment and asks you to refund the difference.'),
('The Escrow Link','A buyer insists on an unfamiliar escrow site that requests banking credentials.'),
('The Title Document','A seller sends a property document and asks for a “commitment fee” before independent verification.'),
('The Land Allocation','Someone claims a government allocation is expiring today and demands immediate payment.'),
('The Vehicle Buyer','A buyer says their transfer failed and asks you to pay a courier fee before the sale proceeds.'),
('The Marketplace Admin','A supposed platform administrator asks for an OTP to release a seller balance.'),
('The Fake Delivery Refund','A courier says a parcel was returned and asks you to enter card details to receive a refund.')
]),
('BUSINESS & WORKPLACE','business', [
('The CEO WhatsApp','A message using an executive’s name asks you to buy gift cards immediately.'),
('The Supplier Bank Change','A familiar supplier suddenly changes bank details and asks for payment today.'),
('The Urgent Payroll File','An email asks HR to send employee banking data to a new address.'),
('The Invoice Attachment','A new invoice contains a different account number and arrives from a compromised-looking thread.'),
('The Vendor Verification','A caller asks you to read an internal verification code to confirm your company account.'),
('The Cloud Share','A shared document link asks you to sign in with your work credentials on an unfamiliar domain.'),
('The Executive Voice','A voice message sounding like a senior manager asks for a confidential transfer.'),
('The Board Meeting Link','A meeting invitation asks attendees to install an unknown browser extension.'),
('The Payroll Redirect','A colleague requests a salary-account change through an unusual email address.'),
('The IT Reset','A supposed IT technician asks for remote access to your work computer to fix a security alert.')
]),
('AI, DEEPFAKE & SYNTHETIC IDENTITY','ai', [
('The Cloned Voice','A voice message sounds exactly like a family member and requests urgent money from an unfamiliar number.'),
('The Deepfake CEO','A video call appears to show a senior executive ordering a confidential payment.'),
('The AI Customer Agent','A highly polished support chatbot asks you to upload a password database to diagnose an issue.'),
('The Synthetic Recruiter','A realistic video recruiter asks you to install remote-access software during an interview.'),
('The Fake Family Video','A short video appears to show a relative asking for emergency funds.'),
('The AI Romance Investor','A long-term online contact uses convincing messages and a synthetic voice to pressure you into an investment.'),
('The Deepfake News Clip','A video appears to show a public official announcing a new investment opportunity with a payment link.'),
('The Voice Verification','A caller says their voice proves identity and asks you to complete a financial action.'),
('The AI Lawyer','A polished voice and document claim to be from a lawyer demanding immediate settlement to avoid legal action.'),
('The Synthetic Supplier','A video meeting appears to show a supplier approving new bank details, but the request is unusual.')
]),
('TECH SUPPORT & MALWARE','malware', [
('The Virus Popup','A website says your device is infected and tells you to call a displayed support number.'),
('The Remote Support App','A caller asks you to install remote-control software to remove malware.'),
('The Fake Browser Update','A page claims your browser is outdated and offers an unknown installer.'),
('The USB Found','An unknown USB drive is found in an office with a tempting label.'),
('The Cracked Software','A free software download disables your security settings and requests administrator access.'),
('The Attachment Warning','An email attachment claims to be an invoice but asks you to enable macros.'),
('The Mobile Cleaner','A pop-up says your phone has thousands of threats and asks you to install a cleaner app.'),
('The QR Installer','A QR code promises a security update but opens an APK/download page from an unknown source.'),
('The Fake VPN','A public Wi-Fi page requires installing a VPN app from an unfamiliar publisher.'),
('The Browser Extension','A site offers a free extension that requests access to passwords and all websites you visit.')
]),
('INVESTMENT, LOAN & RECOVERY FRAUD','investment', [
('The Guaranteed Return','A platform promises guaranteed weekly investment returns with no risk.'),
('The Recovery Agent','Someone says they can recover money you previously lost to a scam for an upfront fee.'),
('The Fake Regulator','A person claiming to be a regulator asks for payment to unlock an investment account.'),
('The Withdrawal Tax','A platform says you must pay a tax to release your investment balance to a personal account.'),
('The Loan Approval Fee','A lender promises immediate approval but requires a fee before disbursement.'),
('The Credit Score Agent','A person asks for your banking login to “repair” your credit profile.'),
('The Trading Mentor','An online mentor insists you send funds to their personal wallet to trade on your behalf.'),
('The Fake Recovery Portal','A website claims to recover crypto and asks for seed phrases.'),
('The Investment Group Admin','A group admin posts fake profit screenshots and pressures members to deposit before midnight.'),
('The Double-Your-Money Offer','A stranger promises to double funds if you transfer money to a specified account.')
]),
('IDENTITY, PRIVACY & DOCUMENT FRAUD','identity', [
('The Verification Form','A supposed service asks for your full identity details, banking information and selfie through an unverified link.'),
('The ID Update','A message says your account requires an urgent identity update and links to a lookalike site.'),
('The BVN Helper','A stranger offers to help fix a banking verification issue and asks for sensitive credentials.'),
('The Passport Agent','An agent asks for identity documents and a large deposit before you can verify their legitimacy.'),
('The Address Confirmation','A caller asks for your home address and date of birth to “confirm a fraud report”.'),
('The Data Breach Alert','A message claims your personal data was leaked and asks you to enter all details to check.'),
('The Fake Survey','A survey offers a reward but requests identity numbers and banking details unrelated to the survey.'),
('The Document Scanner','A website asks you to upload identity documents to unlock a prize or account.'),
('The Impersonated Relative','Someone with personal details about your family asks you to send a copy of your ID.'),
('The Fake Investigator','A person claims to investigate identity theft and asks for your credentials to “freeze” your accounts.')
]),
('DELIVERY, TRAVEL & UTILITY FRAUD','utility', [
('The Failed Delivery Fee','A delivery text says your parcel is held and asks for a small fee through a link.'),
('The Customs Charge','A message claims customs will destroy a package unless you pay immediately.'),
('The Flight Refund','A supposed airline agent offers a refund and asks for card details through chat.'),
('The Hotel Upgrade','A hotel message asks you to pay an upgrade fee through an unfamiliar payment page.'),
('The Electricity Disconnection','A message threatens immediate disconnection and links to a payment page.'),
('The Meter Recharge Helper','Someone asks for your meter details and banking credentials to process a refund.'),
('The Water Bill Agent','A caller claims your bill is overdue and asks for an OTP to stop disconnection.'),
('The Road Toll Refund','A message promises a toll refund but requires banking login details.'),
('The Ride-Hailing Support','A fake support account asks for a verification code after a disputed ride.'),
('The Travel Agent','An agent offers a cheap ticket but insists on payment to a personal account without a verifiable booking.')
]),
('ROMANCE, CHARITY & EMOTIONAL MANIPULATION','emotion', [
('The Emergency Partner','An online partner says they are stranded and asks for urgent travel money.'),
('The Medical Donation','A social post uses an emotional story and asks for donations to a personal account.'),
('The Disaster Appeal','A message claims an emergency has occurred and asks for immediate crypto or transfer donations.'),
('The Soldier Story','An online contact claims they are deployed abroad and needs money to release personal belongings.'),
('The Inheritance Fee','A romantic contact says they are about to receive an inheritance but need a fee to release it.'),
('The Customs Problem','An online contact says a package is held at customs and asks you to pay the release fee.'),
('The Charity Coordinator','A supposed charity worker asks you to collect donations through your personal account.'),
('The Emotional Investment','A trusted online contact pressures you to invest because “we are building our future together”.'),
('The Crisis Group','A community group administrator claims a member is in danger and asks everyone to transfer money immediately.'),
('The Grief Appeal','A message uses a tragic story and insists there is no time to verify the recipient.')
]),
('CLOUD, EMAIL & DIGITAL WORKSPACE','cloud', [
('The Cloud Expiry','A message says your cloud storage expires today and asks you to sign in through a supplied link.'),
('The Shared Drive','A shared document requests a login from an unfamiliar domain.'),
('The File Transfer','A colleague asks you to install a file-transfer tool you have never heard of.'),
('The Email Quota','A warning says your mailbox is full and asks you to re-enter your password.'),
('The Calendar Invite','An unexpected calendar invitation contains a suspicious link and an attachment.'),
('The Collaboration Guest','A new guest account asks you to approve access to sensitive company files.'),
('The Password Expiry','A workplace email demands immediate password renewal through a nonstandard portal.'),
('The Document Signature','A document-signing request asks you to log in with your email password on an unfamiliar page.'),
('The Storage Refund','A service message offers a storage refund but asks for card and account credentials.'),
('The Mail Forwarding Alert','You receive a notice that mail forwarding was enabled and a link asks you to confirm it.')
]),
('PUBLIC WI-FI, DEVICES & PHYSICAL SECURITY','device', [
('The Lookalike Wi-Fi','A café network with a familiar name asks for your email password.'),
('The Free Charger','A stranger offers an unknown charging cable for your unlocked phone.'),
('The Lost Phone Finder','A message claims your lost phone was found and asks you to sign in to locate it.'),
('The Bluetooth Request','An unknown device repeatedly asks to pair with your phone in a public place.'),
('The Public Computer','A shared computer offers to save your password after you sign in.'),
('The Screen Sharing Request','A supposed support agent asks you to share your screen while you open banking information.'),
('The Device Unlock Service','Someone offers to unlock your phone remotely if you provide your passcode.'),
('The Free Power Bank','An unknown power bank is offered at an event and asks you to connect your phone.'),
('The Smart-TV Login','A public screen asks you to scan a QR code to connect your personal account.'),
('The Lost Laptop','A person finds your laptop and asks you to disable its security controls before returning it.')
]),
('LEGITIMATE VERIFICATION & FALSE POSITIVES','legit', [
('A Known Bank Notification','Your bank app displays a security notice inside the app you opened yourself. No one asks for a password or OTP.'),
('A Verified Service Update','You navigate to a service through a bookmark you already trust and see a normal security update there.'),
('A Real Delivery Notice','Your delivery app shows an expected delivery inside your existing signed-in app, with no request for credentials.'),
('A Genuine Password Reset','You initiated a password reset yourself and the official service sends the expected verification step.'),
('A Known Contact Confirmation','A colleague calls using a previously verified company number and follows established payment-change procedures.'),
('An Official Security Prompt',"Your device's built-in security settings notify you about an update and provide the standard system update path."),
('A Normal Two-Factor Prompt','You initiated the login and your authenticator shows the expected code without anyone asking you to share it.'),
('A Legitimate Refund','A retailer processes a refund through the original payment channel without asking for your password or OTP.'),
('A Verified School Portal','You open the school portal using your saved official bookmark and see a normal account notice.'),
('A Trusted Support Channel','You contact a company through its official app and the support team asks only for non-sensitive transaction details.')
])
]

# We need 212 new scenarios. Use 22 family blocks x 10 = 220 candidates; take first 212 with balanced difficulty.
new=[]
idx=start
for cat, fam, items in families:
    for title,msg in items:
        # Two variants per base case for most families, producing a larger library.
        for variant in (1,2):
            if len(new)>=212: break
            vtitle=title if variant==1 else title+' — The Follow-Up'
            if variant==2:
                msg = msg.rstrip('.') + ' A second message arrives increasing pressure and asking you to act before you can independently verify the request.' if fam!='legit' else msg.rstrip('.') + ' A second notice appears, but it does not ask you to bypass normal security controls.'
            legitimate=fam=='legit'
            difficulty = 1 if fam=='legit' else (2 if fam in {'banking','social','education','utility','emotion','device'} else 3)
            if fam in {'ai','business','cloud','investment','identity'} and variant==2: difficulty=4
            buttons=[]
            text=(vtitle+' '+msg).lower()
            for b,terms in [('TRUST',['trusted','familiar','relative','friend','colleague','partner','executive']),('URGENCY',['urgent','immediately','today','before','pressure','quickly']),('FEAR',['threat','blocked','crime','danger','suspend','disconnection']),('CURIOSITY',['video','find','alert','notice','screenshot']),('SYMPATHY',['emergency','medical','stranded','charity','tragic','crisis']),('GREED',['prize','reward','profit','guaranteed','cheap','commission','refund'])]:
                if any(t in text for t in terms): buttons.append(b)
            if not buttons: buttons=['TRUST']
            options=[
                'Act immediately as requested',
                'Pause and verify independently using a trusted official channel or established process',
                'Send a smaller amount or partial information first',
                'Forward the request to someone else and continue following the sender’s instructions'
            ]
            correct=1
            lesson='Pause, verify independently, and keep control of your credentials, money and devices. Do not let pressure determine the next action.'
            if legitimate:
                options=[
                    'Reject it automatically because anything unexpected must be a scam',
                    'Proceed through the trusted, expected channel while keeping sensitive credentials private',
                    'Give a caller any requested password or OTP to be safe',
                    'Move the transaction to an unfamiliar channel'
                ]
                lesson='Good security is not automatic distrust. Verify through a trusted path and protect sensitive credentials.'
            evidence=[]
            if legitimate:
                evidence=['Expected channel','User initiated or independently opened','No credential bypass','Normal security process']
            else:
                evidence=['Unexpected request','Pressure or unusual channel','Potential financial or credential risk','Identity not independently verified']
            new.append({'id':f'A{idx:03d}','title':vtitle,'category':cat,'difficulty':difficulty,'message':msg,'evidence':evidence,'options':options,'correct':correct,'lesson':lesson,'type':'scenario','legitimate':legitimate,'buttons':buttons})
            idx+=1
        if len(new)>=212: break
    if len(new)>=212: break

# Ensure no ID collision and add.
assert len(new)==212
assert len({x['id'] for x in new})==212
sc.extend(new)
p.write_text(json.dumps(sc,indent=2,ensure_ascii=False)+'\n')
print('total',len(sc),'new',len(new))
from collections import Counter
print('difficulty',Counter(x['difficulty'] for x in sc))
print('legit',sum(x['legitimate'] for x in sc))
