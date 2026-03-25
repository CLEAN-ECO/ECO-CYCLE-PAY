document.addEventListener("DOMContentLoaded", () => {
  const USER_STORAGE_KEY = "eco_user";
  const PENDING_SIGNUP_KEY = "eco_pending_signup";
  const SECRET_PHRASE_KEY = "eco_pending_phrase";
  const body = document.body;

  const themeToggle =
    document.getElementById("theme-toggle") ||
    document.getElementById("darkModeToggle");
  const slides = document.querySelectorAll(".slide");

  const redirectByRole = (role) => {
    if (role === "vendor") {
      return "dashboard-vendor.html";
    }

    if (role === "ngo-hub") {
      return "dashboard-ngo.html";
    }

    return "dashboard.html";
  };

  const getStoredUser = () => {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const showMessage = (element, message) => {
    if (!element) return;
    element.textContent = message;
    element.hidden = false;
  };

  const hideMessage = (element) => {
    if (!element) return;
    element.textContent = "";
    element.hidden = true;
  };

  const setActiveStep = (steps, activeStep) => {
    steps.forEach((step) => {
      if (!step) return;
      const isActive = step === activeStep;
      step.hidden = !isActive;
      step.classList.toggle("active", isActive);
    });
  };

  const generateSecretPhrase = () => {
    const words = [
      "green",
      "wallet",
      "planet",
      "plastic",
      "future",
      "bottle",
      "reward",
      "pickup",
      "forest",
      "impact",
      "carbon",
      "energy",
      "clean",
      "market",
      "supply",
      "vendor",
      "earth",
      "solar",
      "river",
      "paper",
      "metal",
      "cycle",
      "secure",
      "profit",
      "growth",
      "hub",
      "mission",
      "nature",
      "points",
      "value",
    ];

    const phrase = [];
    while (phrase.length < 12) {
      const word = words[Math.floor(Math.random() * words.length)];
      if (!phrase.includes(word)) {
        phrase.push(word);
      }
    }
    return phrase;
  };

  const renderSecretPhrase = (phrase, positions) => {
    const secretPhraseGrid = document.getElementById("secretPhraseGrid");
    const confirmWordsGrid = document.getElementById("confirmWordsGrid");

    if (!secretPhraseGrid || !confirmWordsGrid) return;

    secretPhraseGrid.innerHTML = phrase
      .map(
        (word, index) =>
          `<div class="phrase-word"><span>${index + 1}</span><strong>${word}</strong></div>`
      )
      .join("");

    confirmWordsGrid.innerHTML = positions
      .map(
        (position) => `
          <label class="field">
            <span>Confirm word #${position + 1}</span>
            <input
              type="text"
              name="confirm_word_${position}"
              data-word-index="${position}"
              placeholder="Enter word ${position + 1}"
              required
            >
          </label>
        `
      )
      .join("");
  };

  const updatePasswordStrength = (password) => {
    const checks = {
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      length: password.length >= 8,
    };

    const score = Object.values(checks).filter(Boolean).length;

    let label = "Weak";
    let levelClass = "weak";

    if (score >= 4) {
      label = "Strong";
      levelClass = "strong";
    } else if (score >= 2) {
      label = "Medium";
      levelClass = "medium";
    }

    return {
      checks,
      score,
      label,
      levelClass,
      isStrong: score === 4,
    };
  };

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const isDark = body.classList.toggle("dark");
      themeToggle.setAttribute("aria-pressed", String(isDark));
    });
  }

  if (slides.length > 0) {
    let currentSlide = 0;

    const showSlide = (index) => {
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle("active", slideIndex === index);
      });
    };

    showSlide(currentSlide);

    setInterval(() => {
      currentSlide = (currentSlide + 1) % slides.length;
      showSlide(currentSlide);
    }, 5000);
  }

  const signupForm = document.getElementById("signupForm");
  const verificationForm = document.getElementById("verificationForm");
  const walletSetupForm = document.getElementById("walletSetupForm");

  if (signupForm && verificationForm && walletSetupForm) {
    const signupStep = document.getElementById("signupStep");
    const verificationStep = document.getElementById("verificationStep");
    const walletStep = document.getElementById("walletStep");
    const createAccountButton = document.getElementById("createAccountButton");
    const selectedRole = document.getElementById("selectedRole");
    const roleCards = document.querySelectorAll(".role-card");
    const signupPassword = document.getElementById("signupPassword");
    const signupMessage = document.getElementById("signupMessage");
    const verificationMessage = document.getElementById("verificationMessage");
    const walletMessage = document.getElementById("walletMessage");
    const passwordStrengthLabel = document.getElementById("passwordStrengthLabel");
    const strengthBar = document.getElementById("strengthBar");
    const ruleUppercase = document.getElementById("ruleUppercase");
    const ruleLowercase = document.getElementById("ruleLowercase");
    const ruleNumber = document.getElementById("ruleNumber");
    const ruleLength = document.getElementById("ruleLength");
    const generatorFields = document.getElementById("generatorFields");
    const vendorFields = document.getElementById("vendorFields");
    const ngoHubFields = document.getElementById("ngoHubFields");
    const ngoHubType = document.getElementById("ngoHubType");
    const ngoFields = document.getElementById("ngoFields");
    const hubFields = document.getElementById("hubFields");
    const steps = [signupStep, verificationStep, walletStep];

    const toggleFieldRequirements = (container, shouldRequire) => {
      if (!container) return;
      const inputs = container.querySelectorAll("input, select, textarea");
      inputs.forEach((input) => {
        input.required = shouldRequire;
      });
    };

    const setRoleVisibility = (role) => {
      generatorFields.hidden = role !== "generator";
      vendorFields.hidden = role !== "vendor";
      ngoHubFields.hidden = role !== "ngo-hub";

      toggleFieldRequirements(generatorFields, role === "generator");
      toggleFieldRequirements(vendorFields, role === "vendor");
      toggleFieldRequirements(ngoHubFields, role === "ngo-hub");

      if (role !== "ngo-hub") {
        ngoHubType.value = "";
        ngoFields.hidden = true;
        hubFields.hidden = true;
        toggleFieldRequirements(ngoFields, false);
        toggleFieldRequirements(hubFields, false);
      }
    };

    const updateNgoHubType = () => {
      const type = ngoHubType.value;
      const isNgo = type === "NGO";
      const isHub = type === "Hub";
      ngoFields.hidden = !isNgo;
      hubFields.hidden = !isHub;
      toggleFieldRequirements(ngoFields, isNgo);
      toggleFieldRequirements(hubFields, isHub);
    };

    const applyPasswordStrengthUI = (password) => {
      const result = updatePasswordStrength(password);

      if (passwordStrengthLabel) {
        passwordStrengthLabel.textContent = result.label;
        passwordStrengthLabel.className = `strength-label ${result.levelClass}`;
      }

      if (strengthBar) {
        strengthBar.className = `strength-bar ${result.levelClass}`;
        strengthBar.style.width = `${(result.score / 4) * 100}%`;
      }

      if (ruleUppercase) ruleUppercase.classList.toggle("valid", result.checks.uppercase);
      if (ruleLowercase) ruleLowercase.classList.toggle("valid", result.checks.lowercase);
      if (ruleNumber) ruleNumber.classList.toggle("valid", result.checks.number);
      if (ruleLength) ruleLength.classList.toggle("valid", result.checks.length);

      if (createAccountButton) {
        createAccountButton.disabled = !result.isStrong;
      }

      return result;
    };

    roleCards.forEach((card) => {
      card.addEventListener("click", () => {
        const role = card.dataset.role || "";
        selectedRole.value = role;
        roleCards.forEach((item) => item.classList.toggle("active", item === card));
        setRoleVisibility(role);
        hideMessage(signupMessage);
      });
    });

    if (signupPassword) {
      applyPasswordStrengthUI(signupPassword.value);
      signupPassword.addEventListener("input", () => {
        applyPasswordStrengthUI(signupPassword.value);
      });
    }

    if (ngoHubType) {
      ngoHubType.addEventListener("change", updateNgoHubType);
    }

    signupForm.addEventListener("submit", (event) => {
      event.preventDefault();
      hideMessage(signupMessage);

      const formData = new FormData(signupForm);
      const role = String(formData.get("role") || "").trim();
      const fullName = String(formData.get("full_name") || "").trim();
      const email = String(formData.get("email") || "").trim();
      const phone = String(formData.get("phone") || "").trim();
      const password = String(formData.get("password") || "");
      const confirmPassword = String(formData.get("confirm_password") || "");
      const passwordStatus = updatePasswordStrength(password);

      if (!role) {
        showMessage(signupMessage, "Please select a role to continue.");
        return;
      }

      if (!fullName || !email || !phone || !password || !confirmPassword) {
        showMessage(signupMessage, "Please complete all required fields.");
        return;
      }

      if (password !== confirmPassword) {
        showMessage(signupMessage, "Passwords do not match.");
        return;
      }

      if (!passwordStatus.isStrong) {
        showMessage(signupMessage, "Password must be strong before you continue.");
        return;
      }

      let subtype = "";
      let userType = role;
      const roleData = {};

      if (role === "generator") {
        subtype = String(formData.get("generator_subtype") || "").trim();
        if (!subtype) {
          showMessage(signupMessage, "Please choose a waste generator type.");
          return;
        }
        roleData.generatorSubtype = subtype;
      }

      if (role === "vendor") {
        const businessName = String(formData.get("vendor_business_name") || "").trim();
        const businessType = String(formData.get("vendor_business_type") || "").trim();
        const location = String(formData.get("vendor_location") || "").trim();
        const years = String(formData.get("vendor_years") || "").trim();

        if (!businessName || !businessType || !location || !years) {
          showMessage(signupMessage, "Please complete all vendor details.");
          return;
        }

        roleData.businessName = businessName;
        roleData.businessType = businessType;
        roleData.location = location;
        roleData.yearsOfOperation = years;
      }

      if (role === "ngo-hub") {
        userType = String(formData.get("ngo_hub_type") || "").trim();
        if (!userType) {
          showMessage(signupMessage, "Please select NGO or Hub.");
          return;
        }

        subtype = userType;

        if (userType === "NGO") {
          const ngoName = String(formData.get("ngo_name") || "").trim();
          const registration = String(formData.get("ngo_registration") || "").trim();
          const years = String(formData.get("ngo_years") || "").trim();
          const focus = String(formData.get("ngo_focus") || "").trim();
          const location = String(formData.get("ngo_location") || "").trim();
          const mission = String(formData.get("ngo_mission") || "").trim();

          if (!ngoName || !registration || !years || !focus || !location || !mission) {
            showMessage(signupMessage, "Please complete all NGO details.");
            return;
          }

          roleData.organizationName = ngoName;
          roleData.registrationNumber = registration;
          roleData.yearsActive = years;
          roleData.focusArea = focus;
          roleData.location = location;
          roleData.missionDescription = mission;
        }

        if (userType === "Hub") {
          const hubName = String(formData.get("hub_name") || "").trim();
          const capacity = String(formData.get("hub_capacity") || "").trim();
          const location = String(formData.get("hub_location") || "").trim();
          const availability = String(formData.get("hub_availability") || "").trim();
          const wasteTypes = String(formData.get("hub_waste_types") || "").trim();

          if (!hubName || !capacity || !location || !availability || !wasteTypes) {
            showMessage(signupMessage, "Please complete all hub details.");
            return;
          }

          roleData.hubName = hubName;
          roleData.dailyCapacity = capacity;
          roleData.location = location;
          roleData.availability = availability;
          roleData.wasteTypesAccepted = wasteTypes;
        }
      }

      const pendingUser = {
        id: `ECP-${Date.now()}`,
        fullName,
        email,
        phone,
        password,
        role,
        subtype,
        userType,
        roleData,
      };

      localStorage.setItem(PENDING_SIGNUP_KEY, JSON.stringify(pendingUser));
      setActiveStep(steps, verificationStep);
    });

    verificationForm.addEventListener("submit", (event) => {
      event.preventDefault();
      hideMessage(verificationMessage);

      const code = String(new FormData(verificationForm).get("verification_code") || "").trim();

      if (!code) {
        showMessage(verificationMessage, "Please enter the verification code.");
        return;
      }

      const phrase = generateSecretPhrase();
      const positions = [...phrase.keys()]
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .sort((a, b) => a - b);

      localStorage.setItem(SECRET_PHRASE_KEY, JSON.stringify({ phrase, positions }));
      renderSecretPhrase(phrase, positions);
      setActiveStep(steps, walletStep);
    });

    walletSetupForm.addEventListener("submit", (event) => {
      event.preventDefault();
      hideMessage(walletMessage);

      const walletData = new FormData(walletSetupForm);
      const pin = String(walletData.get("wallet_pin") || "").trim();
      const confirmPin = String(walletData.get("confirm_wallet_pin") || "").trim();

      if (!pin || !confirmPin) {
        showMessage(walletMessage, "Please enter and confirm your wallet PIN.");
        return;
      }

      if (!/^\d{4}$/.test(pin)) {
        showMessage(walletMessage, "Wallet PIN must be exactly 4 digits.");
        return;
      }

      if (pin !== confirmPin) {
        showMessage(walletMessage, "Wallet PINs do not match.");
        return;
      }

      const storedPhraseData = localStorage.getItem(SECRET_PHRASE_KEY);
      const storedPendingUser = localStorage.getItem(PENDING_SIGNUP_KEY);

      if (!storedPhraseData || !storedPendingUser) {
        showMessage(walletMessage, "Your signup session expired. Please restart signup.");
        setActiveStep(steps, signupStep);
        return;
      }

      const phraseData = JSON.parse(storedPhraseData);
      const pendingUser = JSON.parse(storedPendingUser);

      const allWordsCorrect = phraseData.positions.every((position) => {
        const inputValue = String(walletData.get(`confirm_word_${position}`) || "")
          .trim()
          .toLowerCase();
        return inputValue === phraseData.phrase[position];
      });

      if (!allWordsCorrect) {
        showMessage(walletMessage, "Secret phrase confirmation does not match.");
        return;
      }

      const referralLink = `ecocyclepay.com/ref?user=${pendingUser.id}`;

      const savedUser = {
        id: pendingUser.id,
        fullName: pendingUser.fullName,
        email: pendingUser.email,
        phone: pendingUser.phone,
        password: pendingUser.password,
        role: pendingUser.role,
        subtype: pendingUser.subtype,
        userType: pendingUser.userType,
        roleData: pendingUser.roleData,
        wallet: {
          pin,
          secretPhrase: phraseData.phrase,
        },
        referralLink,
      };

      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(savedUser));
      localStorage.removeItem(PENDING_SIGNUP_KEY);
      localStorage.removeItem(SECRET_PHRASE_KEY);
      alert("Account created successfully");
      window.location.href = redirectByRole(savedUser.role);
    });
  }

  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    const loginMessage = document.getElementById("loginMessage");
    const toggleLoginPassword = document.getElementById("toggleLoginPassword");
    const loginPassword = document.getElementById("loginPassword");

    if (toggleLoginPassword && loginPassword) {
      toggleLoginPassword.addEventListener("click", () => {
        const isPassword = loginPassword.type === "password";
        loginPassword.type = isPassword ? "text" : "password";
        toggleLoginPassword.textContent = isPassword ? "Hide" : "Show";
      });
    }

    loginForm.addEventListener("submit", (event) => {
      event.preventDefault();
      hideMessage(loginMessage);

      const formData = new FormData(loginForm);
      const identifier = String(formData.get("identifier") || "").trim();
      const password = String(formData.get("password") || "");
      const user = getStoredUser();

      if (!identifier || !password) {
        showMessage(loginMessage, "Please enter both login fields.");
        return;
      }

      if (!user) {
        showMessage(loginMessage, "No account found. Please sign up first.");
        return;
      }

      const matchesIdentifier = user.email === identifier || user.phone === identifier;
      const matchesPassword = user.password === password;

      if (!matchesIdentifier || !matchesPassword) {
        showMessage(loginMessage, "Invalid login details.");
        return;
      }

      window.location.href = redirectByRole(user.role);
    });
  }

  const dashboardPage = document.getElementById("dashboardPage");
  const logoutButton = document.getElementById("logoutButton");
  const dashboardUserName = document.getElementById("dashboardUserName");

  if (dashboardPage) {
    const user = getStoredUser();
    const expectedRole = dashboardPage.dataset.dashboardRole || "generator";

    if (!user) {
      window.location.href = "login.html";
      return;
    }

    if (expectedRole !== user.role) {
      window.location.href = redirectByRole(user.role);
      return;
    }

    if (dashboardUserName) {
      dashboardUserName.textContent = user.fullName || "EcoCycle User";
    }
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(PENDING_SIGNUP_KEY);
      localStorage.removeItem(SECRET_PHRASE_KEY);
      window.location.href = "login.html";
    });
  }

  const submitPage = document.getElementById("submitPage");
  if (submitPage) {
    const user = getStoredUser();
    const title = document.getElementById("submitActionTitle");
    const text = document.getElementById("submitActionText");
    const button = document.getElementById("submitActionButton");
    const categoryCards = document.querySelectorAll(".category-card");

    if (!user) {
      window.location.href = "login.html";
      return;
    }

    categoryCards.forEach((card) => {
      card.addEventListener("click", () => {
        categoryCards.forEach((item) => item.classList.remove("active"));
        card.classList.add("active");
      });
    });

    if (user.role === "ngo-hub") {
      if (title) title.textContent = "View Incoming Waste";
      if (text) text.textContent = "Review and manage waste requests coming into your network.";
      if (button) button.textContent = "View Incoming Waste";
    } else {
      if (title) title.textContent = "Request Pickup";
      if (text) text.textContent = "Schedule a pickup for your selected recyclable materials.";
      if (button) button.textContent = "Request Pickup";
    }
  }

  const walletPage = document.getElementById("walletPage");
  if (walletPage) {
    const user = getStoredUser();
    const referralLinkText = document.getElementById("referralLinkText");
    const copyReferralButton = document.getElementById("copyReferralButton");

    if (!user) {
      window.location.href = "login.html";
      return;
    }

    if (referralLinkText) {
      referralLinkText.textContent = user.referralLink || "ecocyclepay.com/ref?user=00000";
    }

    if (copyReferralButton && referralLinkText) {
      copyReferralButton.addEventListener("click", async () => {
        const link = referralLinkText.textContent || "";
        try {
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(link);
          }
          copyReferralButton.textContent = "Copied";
        } catch {
          copyReferralButton.textContent = "Copied";
        }
      });
    }
  }
});
