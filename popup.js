document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('search');
    const searchButton = document.getElementById('searchButton');
    const radioButtons = document.querySelectorAll('input[type="radio"][name="searchType"]');
    const searchIn = document.getElementById('searchIn');
    //const jsonFiles = ['dictionary.json','subs.json'];
    const jsonFiles = [
        'https://yunseok91.github.io/my-api-data/dictionary.json',
        'https://yunseok91.github.io/my-api-data/subs.json',
        'https://yunseok91.github.io/my-api-data/variables.json'
    ];
    let selectedSearchType = "what";
    searchInput.focus();

    function loadJSON(file, callback) {
        var xobj = new XMLHttpRequest();

        xobj.overrideMimeType("application/json");
        xobj.open('GET', file, true);
        xobj.onreadystatechange = function () {
            if (xobj.readyState == 4 && xobj.status == 200) {
                callback(JSON.parse(xobj.responseText));
            }
        };
        xobj.send(null);
    }
    function loadMultipleJSON(files, callback) {
        var loadedCount = 0;
        var jsonData = {};

        files.forEach(function (file) {
            loadJSON(file, function (data) {
                jsonData[file] = data;
                loadedCount++;

                if (loadedCount == files.length) {
                    callback(jsonData);
                }
            });
        });
    }


    loadMultipleJSON(jsonFiles, function (jsonData) {
        console.log(jsonFiles, "Json Data 가져와" + jsonData)

        //searchfunction
        function searchDictionary() {
            const inputValue = searchInput.value.trim().toLowerCase();
            if (inputValue !== '') {
                searchIn.textContent = '';
                let matchingTerms = [];

                if (selectedSearchType === "variables") {
                    // variables, events, commerce 모든 섹션에서 검색
                    const variablesFile = jsonFiles.find(file => file.includes('variables.json'));
                    const variablesData = jsonData[variablesFile];
                    ['variables', 'events', 'commerce'].forEach(section => {
                        if (variablesData[section]) {
                            const matches = variablesData[section].filter(item =>
                                item.title.toLowerCase().includes(inputValue) ||
                                item.description.toLowerCase().includes(inputValue)
                            );
                            matchingTerms = matchingTerms.concat(matches.map(item => ({
                                section: section,
                                ...item
                            })));
                        }
                    });
                } else {
                    const allData = [].concat.apply([], Object.values(jsonData));
                    matchingTerms = allData.filter(item => {
                        if (item.hasOwnProperty(selectedSearchType)) {
                            return item[selectedSearchType].some(subItem => {
                                if (selectedSearchType == "what") {
                                    return subItem.title.toLowerCase().includes(inputValue);
                                } else if (selectedSearchType == "nations") {
                                    return subItem.site_code.toLowerCase().includes(inputValue) ||
                                        subItem.subsidiary.toLowerCase().includes(inputValue);
                                }
                            });
                        }
                        return false;
                    });
                }
            
            if (matchingTerms.length > 0) {
                searchIn.style.display = 'block';
                let resultHTML = `검색어: ${inputValue} <hr>`;

                if (selectedSearchType === "variables") {
                    // variables 검색 결과 표시
                    matchingTerms.forEach(item => {
                        const highlightedTitle = item.title.replace(new RegExp(inputValue, 'gi'), match => `<span class="highlight">${match}</span>`);
                        const highlightedDesc = item.description
                            .replace(new RegExp(inputValue, 'gi'), match => `<span class="highlight">${match}</span>`)
                            .replace(/\n/g, '<br>'); // \n을 <br>로 변환
                        
                        //resultHTML += `<div class="top">섹션: ${item.section}</div>`;
                        resultHTML += `<div class="top">변수명: ${highlightedTitle}</div>`;
                        resultHTML += `<div class="bottom">매핑값: ${highlightedDesc}</div><hr>`;
                    });
                } else {
                    matchingTerms.forEach(term => {
                        if (term.hasOwnProperty(selectedSearchType)) {
                            term[selectedSearchType].forEach(subItem => {
                                if (selectedSearchType == "what") {
                                    console.log('what 선택됨')
                                    if (subItem.title.toLowerCase().includes(inputValue)) {
                                        const highlightedTitle = subItem.title.replace(new RegExp(inputValue, 'gi'), match => `<span class="highlight">${match}</span>`);
                                        resultHTML += `<div class="top"> 용어: ${highlightedTitle}</div>`;
                                        resultHTML += `<div class="bottom"> 설명: ${subItem.description}</div>`;
                                    }
                                } else if (selectedSearchType == "nations") {
                                    console.log('nations 선택됨')
                                    if (subItem.site_code.toLowerCase().includes(inputValue) || subItem.subsidiary.toLowerCase().includes(inputValue)) {
                                        const highlightedSiteCode = subItem.site_code.replace(new RegExp(inputValue, 'gi'), match => `<span class="highlight">${match}</span>`);
                                        const highlightedSubsidiary = subItem.subsidiary.replace(new RegExp(inputValue, 'gi'), match => `<span class="highlight_s">${match}</span>`);
                                        resultHTML += `<div class="top"> Country : ${subItem.country}</div>`;
                                        resultHTML += `<div class="middle"> Site_code : ${highlightedSiteCode}</div>`;
                                        resultHTML += `<div class="middle"> Subsidiary : ${highlightedSubsidiary}</div>`;
                                        resultHTML += `<div class="bottom"> URL : <a href='${subItem.url}'>${subItem.url}</a></div>`;

                                    }
                                }
                            });
                        }
                    });
                }
                searchIn.innerHTML = resultHTML;
            } else {
                searchIn.style.display = 'block';
                searchIn.innerHTML += `<div id='r'> 검색어: ${inputValue} <hr> 일치하는 결과가 없습니다. <br> 추가를 원하시면 AEM팀에게 문의하세요</div>`;

            }
        } else {
            searchIn.textContent = '';
            searchIn.style.display = 'none';
        }
    }

        function handleKeyPress(event) {
            if (event.key == 'Enter') {
                event.preventDefault();
                searchDictionary();
            }
        }
        function handleRadioChange() {
            selectedSearchType = this.value;
            searchDictionary();
            // searchInput.value = ''; // 검색어 입력창 비우기
            // searchIn.innerHTML = ''; // 결과 영역 초기화
            // searchIn.style.display = 'none'; // 결과 영역 숨기기
            searchInput.focus();
        }

        // 이벤트 리스너 등록
        if (searchInput && searchButton) {
        searchInput.addEventListener('keydown', handleKeyPress);
        searchButton.addEventListener('click', function () {
            loadMultipleJSON(jsonFiles, searchDictionary);
        });
        radioButtons.forEach(radioButton => {
            radioButton.addEventListener('change', handleRadioChange);

            // radioButton.addEventListener('change', function() {
            //     handleRadioChange();
            //     searchInput.value = ''; // 라디오 버튼 변경 시 검색어 입력창 비우기
            // });
        });
    } else {
        console.error('검색 요소를 찾을 수 없습니다.');
    }
});
});