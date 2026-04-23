The core React-specific insight
React gives you components, hooks, context, and utilities – but it doesn’t tell you how to organise them.
Good React projects start by asking: “How will a new developer find the file that renders the login button?”
Bad React projects start by putting everything in components/ and hoping for the best.

What good React folder structures do (from the first commit)
1. Feature‑based folders, not type‑based
Bad (type‑based, extremely common in beginner projects):

text
src/
  components/
    Button.jsx
    UserProfile.jsx
    LoginForm.jsx
    Header.jsx
    Dashboard.jsx
  hooks/
    useAuth.js
    useFetch.js
  pages/
    Home.jsx
    Profile.jsx
  utils/
    formatDate.js
    apiClient.js
Problems:

To work on “user profile”, you need to edit components/UserProfile.jsx, hooks/useAuth.js, pages/Profile.jsx, and utils/apiClient.js – four separate folders.

Components become tightly coupled but physically distant.

By month 6, components/ has 60 files, you can’t tell which are related.

Good (feature‑based):

text
src/
  features/
    auth/
      components/
        LoginForm.jsx
        SignupForm.jsx
      hooks/
        useAuth.js
        useLogin.js
      pages/
        LoginPage.jsx
      services/
        authApi.js
      index.js          // public exports
    dashboard/
      components/
        StatsCard.jsx
      hooks/
        useDashboardData.js
      pages/
        DashboardPage.jsx
  shared/
    ui/
      Button.jsx
      Card.jsx
    hooks/
      useLocalStorage.js
    utils/
      formatDate.js
    api/
      client.js        // base axios/fetch instance
Why it works:

Everything for “auth” lives under features/auth/. If you delete the feature, delete the folder – no orphans.

Shared UI components are truly reusable and have no feature knowledge.

New feature? Copy features/auth/, rename, start coding.

2. Co‑locate tests, styles, and types with components
Bad:

text
src/components/Button.jsx
src/styles/Button.css
src/__tests__/Button.test.js
src/types/Button.d.ts
You have to jump between four directories to understand one button.

Good:

text
src/features/auth/components/LoginForm/
  LoginForm.jsx
  LoginForm.module.css   (or .scss)
  LoginForm.test.jsx
  LoginForm.types.ts     (if using TypeScript)
  index.js               (exports only the component)
At the beginning, even for a single Button component, use this pattern.
It costs 5 extra seconds per component but saves hours of “where is the test for this?” later.

3. Clear separation of routes / pages vs. presentational components
Bad: Mixing routing logic inside generic components – UserProfile.jsx contains useParams and fetches data, making it impossible to reuse.

Good (container / presenter pattern, enforced by folder structure):

text
src/features/user/
  components/
    UserProfileView.jsx     // pure presentational, receives props
  pages/
    UserProfilePage.jsx     // container: fetches data, uses useParams, renders UserProfileView
  hooks/
    useUserData.js
In the beginning, even if UserProfilePage is tiny, put it in pages/. You’ll thank yourself when you need to render the same profile inside a modal.

4. One component per file, named after the file
Bad:
Button.jsx exports PrimaryButton, SecondaryButton, IconButton.
Now you can’t tell which file to edit for which button. Imports become import { PrimaryButton, SecondaryButton } from './Button' – confusing.

Good:
PrimaryButton.jsx exports PrimaryButton as default.
SecondaryButton.jsx exports SecondaryButton.
IconButton.jsx exports IconButton.
File name = component name. No exceptions.

5. Absolute imports with a jsconfig.json or tsconfig.json paths
Bad:
import Button from '../../../shared/ui/Button' – brittle, breaks if you move a file.

Good:

json
// jsconfig.json
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@features/*": ["features/*"],
      "@shared/*": ["shared/*"]
    }
  }
}
Then:
import Button from '@shared/ui/Button'
In the beginning, set this up before writing the first component. It signals that the project cares about maintainability.

What bad React folder structures do (from the beginning)
1. All components in one components/ folder, all pages in pages/
components/ becomes a dumping ground for 100+ files.

No way to know which components belong together.

Renaming a component breaks nothing, but finding it breaks morale.

2. Hooks in a global hooks/ folder
useAuth, useFetch, useForm, useDebounce all together.

When you need to change useAuth, you have to touch unrelated hooks’ folders? No, but the mental overhead is real.

After 20 hooks, you forget what each one does.

3. No index.js barrel files for features
Imports become long chains: import LoginForm from '../../features/auth/components/LoginForm/LoginForm'

Later, when you move LoginForm to a subfolder, you break 15 imports.

4. Global styles/ folder with one massive CSS file
Component styles are not co‑located.

Changing a button’s style affects buttons everywhere because of cascading.

Dead CSS never gets deleted.

5. Context providers scattered randomly
AuthContext defined in App.jsx, ThemeContext in Layout.jsx, CartContext in CheckoutPage.jsx.

No single place to see all global state providers.

Leads to “context not available” errors.

The beginning difference in React
Good React project – first commit:
text
my-app/
  public/
  src/
    features/
      health-check/
        HealthCheck.jsx        // simple component
        HealthCheck.module.css
        HealthCheck.test.jsx
    shared/
      ui/
        Button/
          Button.jsx
          Button.module.css
          Button.test.jsx
          index.js
    App.jsx
    main.jsx
    index.css                // only reset / global variables
  jsconfig.json              // absolute imports
  package.json
Even with just 3 components, the structure is in place.
Every new component follows the same pattern.
The team never asks “where should this go?” – it’s obvious.

Bad React project – first commit:
text
my-app/
  src/
    App.jsx
    index.js
    components/
      Header.jsx
      Button.jsx
    pages/
      Home.jsx
    App.css
  package.json
Looks fine initially. But by week 3:

components/ has 15 files, including LoginModal.jsx and UserAvatar.jsx – no clear grouping.

Someone creates hooks/useAuth.js next to components/.

Another person creates utils/api.js.

No tests because “we’ll add them later” – but with this structure, where would tests even go?

The React‑specific warning signs
Good	Bad
You can delete a feature folder and the app still works	Deleting one component breaks 10 unrelated pages because of hidden dependencies
Every component has a neighbouring .test.jsx and .module.css	Styles are in a global file, tests are in a distant __tests__ folder
Imports use @features/auth	Imports use ../../../..
The shared/ui folder has <10 truly reusable components	components/ has 50 files, half of which are page‑specific
Adding a new route takes 2 minutes (create feature, add to router)	Adding a new route means guessing which existing component to extend
The single most important React decision at the beginning: Do not create a components/ folder. Create features/ and shared/ui instead.
That one choice forces you to think in terms of domains, not types. It prevents the “100 components in a flat list” nightmare. It makes code splitting and lazy loading trivial later.
Every React horror story I’ve seen started with mkdir components on day one.

