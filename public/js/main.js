let main = (data) => {

    // FIELDS
    const $inputButton = $("#add-button");
    const $sortDateButton = $("#sort-button-date");
    const $sortDescrButton = $("#sort-button-descr");
    const $datePicker = $("#date-input");
    const today = new Date().toISOString().split('T')[0];

    let toDos = data.map((todo) => {
        return {
            Completed: todo.Completed,
            CompletionDate: todo.CompletionDate,
            Description: todo.Description,
            DueDate: todo.DueDate,
            Priority: todo.Priority,
            Title: todo.Title,
            id: todo.id
        }
    });

    //Class for a TodoItem
    class TodoItem {
        constructor(id, title, date, priority, completed) {
            this.id = id;
            this.Title = title;
            this.DueDate = date;
            this.Priority = priority;
            this.Completed = completed;
        }
    }

    // Update the todoitem in the SQL DB
    let updateTodo = (TodoItem) => {
        $.post("/updatetodo", {
            "data": TodoItem
        });
    };

    // Deletes the todoitem from SQL DB
    let deleteTodo = (TodoItem) => {
        $.post("/deletetodo", {
            "data": TodoItem
        });
    };

    (function () {
        toDos.forEach((todo) => {
            todo.DueDate = todo.DueDate.substring(0, 10);
        })
    })();


    // min date for the datepicker to today
    (function () {
        $datePicker.attr('min', today);
    })();


    //Add to-do and update server with the to-do
    $inputButton.on("click", () => {
        let $textInput = $(".input-text");
        let $dateInput = $(".input-date");

        if ($textInput.val().length !== 0 && $dateInput.val().length !== 0) {
            let title = $textInput.val();
            let date = $dateInput.val();

            // New to-do item starts with priority of 1
            let newToDo = new TodoItem(null, title, date, 1, 0);

            // Adds the todoitem to the SQL DB and updates the id
            $.post("/addtodo", {
                "data": newToDo
            }, function (data) {
                handleAdd(data);
            });

            let handleAdd = function (data) {
                newToDo.id = parseInt(data);
                toDos.push(newToDo);
                addTodo(newToDo);
            };

            //handleAdd();

            //reset value of the input fields.
            $textInput.val("");
            $dateInput.val("");

        } else {
            //TODO: This should be a flash
            alert("You forgot to fill in a title or the date!");
        }
    });

    let addTodo = (todo) => {
        let $doneButton = $('<button>').addClass("doneButton");
        if (todo.Completed == 0) {
            $doneButton.text("Done");
        } else {
            $doneButton.text("Undo");
        }

        let $importanceButton = $('<button>').addClass('importanceButton');
        $importanceButton.addClass("fa fa-star-o");
        $importanceButton.attr("important", todo.Priority);
        if (todo.Priority === 2 || todo.Priority === 3) {
            $importanceButton.removeClass("fa fa-star-o");
            $importanceButton.addClass("fa fa-star");
        } else {
            $importanceButton.removeClass("fa fa-star");
            $importanceButton.addClass("fa fa-star-o");
        }

        let $todoTextInput = $("<input>").attr("type", "text");
        $todoTextInput.addClass("descriptionField");
        $todoTextInput.val(todo.Title);
        $todoTextInput.attr({'autocorrect': 'off', 'spellcheck': 'false'});

        let $todoDateInput = $("<input>").attr("type", "date");
        $todoDateInput.addClass("dateField");
        $todoDateInput.val(todo.DueDate);
        $todoDateInput.attr('min', today);

        if (todo.DueDate < today) {
            $todoDateInput.attr("overdue", true);
        } else {
            $todoDateInput.attr("overdue", false);
        }

        let $deleteButton = $("<button>").addClass("deleteButton");
        $deleteButton.addClass("fa fa-times");
        $deleteButton.css('color', 'red');

        let $content = $("<div>").append($doneButton)
            .append($importanceButton)
            .append($todoTextInput)
            .append($todoDateInput)
            .append($todoDateInput)
            .append($deleteButton);
        $content.attr("Id", todo.id);
        $content.addClass("todo-item");

        if (todo.Completed == 0) {
            $content.hide();
            $(".todos").append($content);
            $content.fadeIn();
        } else {
            $content.hide();
            $(".done").append($content);
            $content.fadeIn();
        }

        $doneButton.click(() => {
            if (todo.Completed === 1) {
                todo.Completed = 0;
                $content.hide();
                $content.detach().appendTo(".todos");
                $doneButton.text("Done");
            } else {
                todo.Completed = 1;
                $content.hide();
                $content.detach().appendTo(".done");
                $doneButton.text("Undo");
            }
            $content.fadeIn();
            updateToDoList(todo);
            updateTodo(todo);
        });

        $importanceButton.click(() => {
            //Toggles the priority
            todo.Priority = todo.Priority === 3 ? 1 : todo.Priority = todo.Priority === 2 ? 3 : 2;
            $importanceButton.attr("important", todo.Priority);
            if (todo.Priority === 2 || todo.Priority === 3) {
                $importanceButton.removeClass("fa fa-star-o");
                $importanceButton.addClass("fa fa-star");
            } else {
                $importanceButton.removeClass("fa fa-star");
                $importanceButton.addClass("fa fa-star-o");
            }
            updateTodo(todo);
        });

        $todoTextInput.on('input', () => {
            todo.Title = $todoTextInput.val();
            updateTodo(todo);
        });

        $todoDateInput.on('input', () => {
            todo.DueDate = $todoDateInput.val();
            updateTodo(todo);
        });

        $deleteButton.click(() => {
            deleteTodo(todo);
            $content.remove();
            //removing from the list of todos
            toDos = toDos.filter((el) => {
                return el.id !== todo.id;
            });
        });
    };

    //sort by date
    $sortDateButton.on("click", () => {
        toDos.forEach(function (TodoItem) {
            $('#' + TodoItem.id).remove();
        });

        toDos.sort((a, b) => {
            if (a.DueDate < b.DueDate) {
                return -1;
            }
            return 1;
        });
        updateAllTodos();
        loadTodos();
    });

    //sort by descriptions
    $sortDescrButton.on("click", () => {
        toDos.forEach(function (TodoItem) {
            $('#' + TodoItem.id).remove();
        });

        toDos.sort((a, b) => {
            if (a.Title < b.Title) {
                return -1;
            }
            return 1;
        });
        updateAllTodos();
        loadTodos();
    });

    // removes the to-do from the list and adds it again with the updated state
    let updateToDoList = (todo) => {
        toDos = toDos.filter((el) => {
            return el.id !== todo.id;
        });
        toDos.push(todo);
    };

    //updates the array with todos
    let updateAllTodos = () => {
        toDos.forEach(function (TodoItem) {
            updateToDoList(TodoItem);
        })
    };

    //loads all the todos from the toDos array.
    const loadTodos = function () {
        toDos.forEach(function (TodoItem) {
            addTodo(TodoItem);
        });
    };
    loadTodos();


    //Adds the current date to the footer
    (() => {
        const now = new Date();

        let day = now.getDate();
        let month = now.getMonth() + 1; //January is 0!
        const year = now.getFullYear();

        if (day < 10) {
            day = '0' + day;
        }
        if (month < 10) {
            month = '0' + month;
        }

        const par = $('<p>');
        par.val('today: ' + day + '-' + month + '-' + year);

        $(".today-footer").append(par);
    })();
};

// const socket = io.connect('http://localhost:4000');
// socket.on('news', function (data) {
//     console.log(data);
//     socket.emit('my other event', {my: 'data'});
// });

$(document).ready(function () {
    $.get("/gettodos", function (data) {
        main(data);
    });
});