// Get all necessary elements
const searchInput = document.getElementById('search-input');
const suggestionsContainer = document.getElementById('suggestions');
const searchForm = document.getElementById('search-form');
const clearSearchButton = document.getElementById('clear-button');
const WEATHER_API_KEY = '92a96530a3f95835488eec27c670ef5e'; // Replace with your OpenWeatherMap API key

// Variables for suggestions
let timeoutId;
let selectedIndex = -1;

// Clock function
function updateClock() {
    const now = new Date();
    const clockTime = document.querySelector('.clock-time');
    const clockDay = document.querySelector('.clock-day');
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    if (clockTime && clockDay) {
        // Update time
        let hours = now.getHours();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const minutes = String(now.getMinutes()).padStart(2, '0');
        clockTime.textContent = `${hours}:${minutes} ${ampm}`;
        
        // Update day
        clockDay.textContent = days[now.getDay()];
    }
}

// Weather functions
function getWeather(latitude, longitude) {
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=imperial&appid=${WEATHER_API_KEY}`)
        .then(response => response.json())
        .then(data => {
            const weatherInfo = document.querySelector('.weather-info');
            if (weatherInfo) {
                const temp = Math.round(data.main.temp);
                const description = data.weather[0].main;
                const icon = getWeatherIcon(description);
                weatherInfo.innerHTML = `<i class="fa-solid ${icon}"></i> ${temp}°F`;
            }
        })
        .catch(error => console.error('Error fetching weather:', error));
}

function getWeatherIcon(weather) {
    const icons = {
        'Clear': 'fa-sun',
        'Clouds': 'fa-cloud',
        'Rain': 'fa-cloud-rain',
        'Snow': 'fa-snowflake',
        'Thunderstorm': 'fa-cloud-bolt',
        'Drizzle': 'fa-cloud-rain',
        'Mist': 'fa-smog',
        'Fog': 'fa-smog',
        'Haze': 'fa-smog'
    };
    return icons[weather] || 'fa-temperature-half';
}

// Search functionality
searchInput.addEventListener('input', function(e) {
    const query = e.target.value.trim();
    
    if (query.length === 0) {
        searchInput.parentElement.classList.remove('has-content');
        clearSearchButton.classList.remove('visible');
        suggestionsContainer.style.display = 'none';
        selectedIndex = -1;
        return;
    }
    
    searchInput.parentElement.classList.add('has-content');
    clearSearchButton.classList.add('visible');
    
    // Fetch suggestions
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
        const existingScript = document.getElementById('search-script');
        if (existingScript) {
            existingScript.remove();
        }

        window.autocompleteCallback = function(data) {
            displaySuggestions(data);
        };

        const script = document.createElement('script');
        script.id = 'search-script';
        script.src = `https://duckduckgo.com/ac/?q=${encodeURIComponent(query)}&callback=autocompleteCallback`;
        document.body.appendChild(script);
    }, 300);
});

function displaySuggestions(data) {
    if (!data || data.length === 0) {
        suggestionsContainer.style.display = 'none';
        return;
    }

    suggestionsContainer.innerHTML = '';
    
    // Reverse the suggestions array for mobile view
    if (window.innerWidth <= 768) {
        data = data.reverse();
    }

    data.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.innerHTML = `
            <i class="fa-solid fa-magnifying-glass"></i>
            <span>${item.phrase}</span>
        `;
        
        div.addEventListener('click', () => {
            searchInput.value = item.phrase;
            suggestionsContainer.style.display = 'none';
            searchForm.submit();
        });
        
        suggestionsContainer.appendChild(div);
    });
    
    suggestionsContainer.style.display = 'block';
}

// Bookmark functionality
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = '.html';
fileInput.style.display = 'none';
document.body.appendChild(fileInput);

const importButton = document.createElement('button');
importButton.innerHTML = '<i class="fa-solid fa-file-import"></i> Import Bookmarks';
importButton.className = 'import-button';
document.querySelector('.sidebar').insertBefore(importButton, document.getElementById('bookmark-tree'));

const clearButton = document.createElement('button');
clearButton.innerHTML = '<i class="fa-solid fa-trash"></i> Clear Bookmarks';
clearButton.className = 'import-button clear-button';
document.querySelector('.sidebar').insertBefore(clearButton, document.getElementById('bookmark-tree'));

function saveBookmarks(bookmarks) {
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
}

function loadBookmarks() {
    const saved = localStorage.getItem('bookmarks');
    if (saved) {
        const bookmarks = JSON.parse(saved);
        renderBookmarks(bookmarks);
    }
}

function parseBookmarks(content) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const bookmarkList = [];
    
    function processNode(node, parent) {
        const children = node.children;
        for (let child of children) {
            if (child.tagName === 'DT') {
                const item = child.firstElementChild;
                if (item.tagName === 'H3') {
                    const folder = {
                        name: item.textContent,
                        type: 'folder',
                        children: []
                    };
                    if (parent) {
                        parent.children.push(folder);
                    } else {
                        bookmarkList.push(folder);
                    }
                    const dl = child.querySelector('dl');
                    if (dl) processNode(dl, folder);
                } else if (item.tagName === 'A') {
                    const bookmark = {
                        name: item.textContent,
                        url: item.href,
                        type: 'bookmark'
                    };
                    if (parent) {
                        parent.children.push(bookmark);
                    } else {
                        bookmarkList.push(bookmark);
                    }
                }
            }
        }
    }

    const bookmarkElements = doc.querySelectorAll('dl');
    bookmarkElements.forEach(element => {
        processNode(element, null);
    });

    saveBookmarks(bookmarkList);
    renderBookmarks(bookmarkList);
}

function renderBookmarks(bookmarks) {
    const container = document.getElementById('bookmark-tree');
    container.innerHTML = '';
    createBookmarkTree(bookmarks, container);
}

function createBookmarkTree(bookmarks, container) {
    bookmarks.forEach(item => {
        if (item.type === 'folder') {
            const folderDiv = document.createElement('div');
            folderDiv.className = 'bookmark-folder';
            
            const folderName = document.createElement('div');
            folderName.className = 'folder-name';
            folderName.innerHTML = `
                <i class="fa-solid fa-chevron-right folder-icon"></i>
                <i class="fa-solid fa-folder"></i>
                ${item.name}
            `;
            
            const folderContent = document.createElement('div');
            folderContent.className = 'folder-content';
            
            folderName.addEventListener('click', () => {
                folderDiv.classList.toggle('open');
            });
            
            folderDiv.appendChild(folderName);
            folderDiv.appendChild(folderContent);
            container.appendChild(folderDiv);
            
            if (item.children && item.children.length > 0) {
                createBookmarkTree(item.children, folderContent);
            }
        } else {
            const link = document.createElement('a');
            link.className = 'bookmark-item';
            link.href = item.url;
            link.target = '_blank';
            link.innerHTML = `
                <i class="fa-solid fa-globe"></i>
                ${item.name}
            `;
            container.appendChild(link);
        }
    });
}

// Event Listeners
fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            parseBookmarks(e.target.result);
        };
        reader.readAsText(file);
    }
});

importButton.addEventListener('click', () => fileInput.click());

clearButton.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all bookmarks?')) {
        localStorage.removeItem('bookmarks');
        document.getElementById('bookmark-tree').innerHTML = '';
    }
});

document.getElementById('sidebar-toggle').addEventListener('click', function() {
    document.getElementById('sidebar').classList.toggle('open');
});

// Load bookmarks on page load
document.addEventListener('DOMContentLoaded', loadBookmarks);

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
    updateClock();
    loadBookmarks();
    
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function(position) {
            getWeather(position.coords.latitude, position.coords.longitude);
            
            // Update weather every 30 minutes
            setInterval(() => {
                getWeather(position.coords.latitude, position.coords.longitude);
            }, 30 * 60 * 1000);
        }, function(error) {
            console.error('Error getting location:', error);
        });
    }
});

// Update clock every second
setInterval(updateClock, 1000);

// Keyboard navigation
searchInput.addEventListener('keydown', function(e) {
    const suggestionItems = document.querySelectorAll('.suggestion-item');
    
    switch(e.key) {
        case 'ArrowDown':
            e.preventDefault();
            if (suggestionItems.length === 0) return;
            
            if (selectedIndex >= 0) {
                suggestionItems[selectedIndex].classList.remove('selected');
            }
            
            selectedIndex = (selectedIndex + 1) % suggestionItems.length;
            suggestionItems[selectedIndex].classList.add('selected');
            searchInput.value = suggestionItems[selectedIndex].querySelector('span').textContent;
            break;
            
        case 'ArrowUp':
            e.preventDefault();
            if (suggestionItems.length === 0) return;
            
            if (selectedIndex >= 0) {
                suggestionItems[selectedIndex].classList.remove('selected');
            }
            
            selectedIndex = selectedIndex < 0 ? suggestionItems.length - 1 : selectedIndex - 1;
            if (selectedIndex < 0) selectedIndex = suggestionItems.length - 1;
            suggestionItems[selectedIndex].classList.add('selected');
            searchInput.value = suggestionItems[selectedIndex].querySelector('span').textContent;
            break;
            
        case 'Escape':
            suggestionsContainer.style.display = 'none';
            selectedIndex = -1;
            break;
            
        case 'Enter':
            if (selectedIndex >= 0 && suggestionItems[selectedIndex]) {
                e.preventDefault();
                searchInput.value = suggestionItems[selectedIndex].querySelector('span').textContent;
                suggestionsContainer.style.display = 'none';
                searchForm.submit();
            }
            break;
    }
});

// Clear search button handler
clearSearchButton.addEventListener('click', function(e) {
    e.preventDefault();
    searchInput.value = '';
    suggestionsContainer.style.display = 'none';
    clearSearchButton.classList.remove('visible');
    searchInput.parentElement.classList.remove('has-content');
    selectedIndex = -1;
    searchInput.focus();
});

// Close suggestions when clicking outside
document.addEventListener('click', function(e) {
    if (!searchForm.contains(e.target)) {
        suggestionsContainer.style.display = 'none';
        selectedIndex = -1;
    }
});

// Add global keyboard capture for search focus
document.addEventListener('keydown', function(e) {
    // Ignore if user is already typing in an input or if key pressed is a modifier key
    if (e.target.tagName === 'INPUT' || 
        e.target.tagName === 'TEXTAREA' || 
        e.ctrlKey || 
        e.altKey || 
        e.metaKey) {
        return;
    }

    // Ignore function keys and other special keys
    if (e.key.length !== 1) {
        return;
    }

    // Focus the search input and trigger the input
    searchInput.focus();
});

// Add touch event handling
document.addEventListener('touchstart', function(e) {
    if (!searchForm.contains(e.target)) {
        suggestionsContainer.style.display = 'none';
    }
}); 