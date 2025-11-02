document.addEventListener("DOMContentLoaded", () => {
  const recordBtn = document.getElementById("recordBtn");
  const analyzeBtn = document.getElementById("analyzeBtn");
  const inputText = document.getElementById("inputText");
  const loader = document.getElementById("loader");
  const resultLabel = document.getElementById("resultLabel");
  const suggestions = document.getElementById("suggestions");
  const improvements = document.getElementById("improvements");
  let recognition,
    listening = false;
  let chart = null;

  // Setup Chart
  const ctx = document.getElementById("pieChart").getContext("2d");
  chart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Low", "Moderate", "High"],
      datasets: [
        {
          data: [1, 0, 0],
          backgroundColor: ["#0d6efd", "#17a2b8", "#dc3545"],
        },
      ],
    },
    options: { responsive: true },
  });

  // Voice recognition
  if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      inputText.value = inputText.value ? inputText.value + " " + text : text;
    };
    recognition.onend = () => {
      listening = false;
      recordBtn.classList.remove("btn-danger");
      recordBtn.classList.add("btn-outline-primary");
      recordBtn.textContent = "🎤 Record";
    };
  } else {
    recordBtn.disabled = true;
    recordBtn.title = "Voice not supported";
  }

  recordBtn.addEventListener("click", () => {
    if (!recognition) return;
    if (!listening) {
      recognition.start();
      listening = true;
      recordBtn.classList.remove("btn-outline-primary");
      recordBtn.classList.add("btn-danger");
      recordBtn.textContent = "● Recording";
    } else {
      recognition.stop();
    }
  });

  // Analyze action
  analyzeBtn.addEventListener("click", async () => {
    const text = inputText.value.trim();
    if (!text) {
      alert("Please enter or record a message first.");
      return;
    }
    loader.classList.remove("d-none");
    analyzeBtn.disabled = true;
    try {
      const res = await fetch("/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      // Update label
      resultLabel.textContent = data.label || "—";
      // Update chart
      const scores = data.scores || { low: 0, moderate: 0, high: 0 };
      chart.data.datasets[0].data = [scores.low, scores.moderate, scores.high];
      chart.update();
      // Suggestions dynamic
      if (data.label && data.label.toLowerCase().includes("high")) {
        suggestions.innerHTML =
          "<strong>Immediate tips:</strong><ul><li>Take deep breaths for 2 minutes</li><li>Contact trusted friend or professional</li><li>Try grounding techniques</li></ul>";
      } else if (data.label && data.label.toLowerCase().includes("moderate")) {
        suggestions.innerHTML =
          "<strong>Suggestions:</strong><ul><li>Take a short walk</li><li>Limit social media</li><li>Try a 5-minute breathing exercise</li></ul>";
      } else {
        suggestions.innerHTML =
          "<strong>All good:</strong><ul><li>Keep a habit of journaling</li><li>Maintain regular sleep</li></ul>";
      }
    } catch (err) {
      console.error(err);
      alert("Analysis failed.");
    } finally {
      loader.classList.add("d-none");
      analyzeBtn.disabled = false;
    }
  });

  // Small animated toast remove after time
  setTimeout(() => {
    document
      .querySelectorAll(".toast.show")
      .forEach((t) => t.classList.remove("show"));
  }, 3000);
});
