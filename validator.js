function Validator(options) {

  // Hàm Lấy thẻ cha, ông, cố, cụ cố, tổ của element
  function getParent(element, selector){
    while (element.parentElement) {
      if (element.parentElement.matches(selector)) {
        return element.parentElement
      }
      element = element.parentElement
    }
  }

  let selectorRules = {}

  // Hàm thực hiện validate
  function validate(inputElement, rule) {
    let errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorMessage);
    let errorMessage;

    // Lấy ra các rule của selector
    let rules = selectorRules[rule.selector];

    // Lặp qua từng rule và kiểm tra
    // Nếu có lỗi thì dừng việc kiểm tra
    for (let i = 0; i < rules.length; ++i) {

      switch (inputElement.type) {
        case 'checkbox':
        case 'radio':
          errorMessage =  rules[i](formElement.querySelector(rule.selector + ':checked'))
          break;
        default: 
          errorMessage =  rules[i](inputElement.value)
      }
      if (errorMessage) {
        break;
      }
    }


    if (errorMessage) {
      errorElement.innerText = errorMessage;
      getParent(inputElement, options.formGroupSelector).classList.add("invalid");
    } else {
      errorElement.innerText = "";
      getParent(inputElement, options.formGroupSelector).classList.remove("invalid");
    }
    return !errorMessage
  }



  // Lấy element của form cần validate
  let formElement = document.querySelector(options.form);

  if (formElement) {

    // Khi submit form 
    formElement.onsubmit = (e) => {
      e.preventDefault()

      let isFormValid = true;

      //Lặp qua từng rule và validate
      options.rules.forEach((rule) => {
        let inputElement = formElement.querySelector(rule.selector);
        let isValid = validate(inputElement, rule);
        if (!isValid) {
          isFormValid = false;
        }
      })

      if (isFormValid) {

        // Submit với Javascript
        if (typeof options.onSubmit === 'function') {

          let enableInputs = formElement.querySelectorAll('[name]:not([disabled])')
          let formValues = Array.from(enableInputs).reduce((value,input) => {
            
            switch(input.type){
              case 'checkbox':
                if (input.matches(':checked')) {
                  value[input.name] = ''
                  return value
                }
                if (!Array.isArray(value[input.name])) {
                  value[input.name] = []
                }
                value[input.name].push(input.value)
                break;
              case 'radio':
                  value[input.name] = formElement.querySelector('input[name="' + input.name + '"]:checked').value
                break;
              case 'file':
                  value[input.name] = input.files
                break;
              default:
                value[input.name] = input.value
            }
            return value
          }, {})
          options.onSubmit(formValues)
        }
      }
      
      // Submit với hành vi mặc định
      else{
        formElement.submit()
      }
    }
    // Lặp qua mỗi rule và xử lý (lắng nghe sự kiện,...)
    options.rules.forEach((rule) => {

      // Lưu lại các Rules cho mỗi input

      if (Array.isArray(selectorRules[rule.selector])) {
        selectorRules[rule.selector].push(rule.test);
      }else{
        selectorRules[rule.selector] = [rule.test];
      }

      let inputElements = formElement.querySelectorAll(rule.selector);

      Array.from(inputElements).forEach(inputElement => {
        if (inputElement) {
  
          // Xử lý trường hợp blur ra ngoài input
          inputElement.onblur = () => {
            validate(inputElement, rule)
          };
          
          // Xử lý trường hợp nhập trong input
          inputElement.oninput = () => {
            getParent(inputElement, options.formGroupSelector).querySelector(options.errorMessage);
            errorElement.innerText = "";
            getParent(inputElement, options.formGroupSelector).classList.remove("invalid");
          }
        }
      })
    });
  }
}

// Định nghĩa rules
// Nguyên tắc của rules:
//1. Khi có lỗi  => trả về mess lỗi
//2. Khi hợp lệ => không trả gì (undefined)
Validator.isRequired = (selector, message) => {
  return {
    selector: selector,
    test: (value) => {
      return value ? undefined : message || "Please enter this field";
    },
  };
};

Validator.isEmail = (selector, message) => {
  return {
    selector: selector,
    test: (value) => {
      let regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      return regex.test(value) ? undefined : message || "Please enter your email";
    },
  };
};


Validator.minLength = (selector, min, message) => {
  return {
    selector: selector,
    test: (value) => {
      return  value.length >= min ? undefined :message || `Please enter ${min} character`
    }
  }
}

Validator.isConfirmed = (selector, getConfirmValue, message) => {
  return {
    selector: selector,
    test: (value) => {
      return value === getConfirmValue() ? undefined : message || 'The value entered is incorrect'
    }
  }
}